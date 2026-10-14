---
title: "苍穹外卖 Day 07：缓存与购物车"
description: "用 Redis 和 Spring Cache 缓存菜品与套餐，梳理缓存清理策略，实现购物车添加、查看和清空。"
category: "web"
tags: ["Redis","Spring Cache","购物车","苍穹外卖"]
cover: "sky"
importedAt: "2026-10-14"
series: "sky-takeout"
seriesOrder: 7
sourceLabel: "黑马程序员《苍穹外卖》课程学习笔记，含个人批注与调试记录"
---

> 这节课主要是Spring Cache 后面的购物车是基本的增删改查
>

## 课程内容
+ 缓存菜品
+ 缓存套餐
+ 添加购物车
+ 查看购物车
+ 清空购物车



功能实现：**缓存商品**、**购物车**

**效果图：**

 <!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791892178439-8de74e1a-7fb5-4acf-acb1-97e22df1943a.png)

## 1. 缓存菜品
### 1.1 问题说明
用户端小程序展示的菜品数据都是通过查询数据库获得，如果用户端访问量比较大，数据库访问压力随之增大。

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791892190381-001e063b-ef19-4859-a035-9609ca4e7f4b.png)

**结果：**系统响应慢、用户体验差

### 1.2 实现思路
通过Redis来缓存菜品数据，减少数据库查询操作。

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791892204825-07481532-3df4-4370-b222-f40b6381a005.png)

**缓存逻辑分析：**

+ 每个分类下的菜品保存一份缓存数据
+ 数据库中菜品数据有变更时清理缓存数据

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791892212897-6a56282e-318a-472b-a4aa-c5a02b0ee801.png)

### 1.3 代码开发
**修改用户端接口 DishController 的 list 方法，加入缓存处理逻辑：**

```java
    @Autowired
    private RedisTemplate redisTemplate;
    /**
     * 根据分类id查询菜品
     *
     * @param categoryId
     * @return
     */
    @GetMapping("/list")
    @ApiOperation("根据分类id查询菜品")
    public Result<List<DishVO>> list(Long categoryId) {

        //构造redis中的key，规则：dish_分类id
        String key = "dish_" + categoryId;

        //查询redis中是否存在菜品数据
        List<DishVO> list = (List<DishVO>) redisTemplate.opsForValue().get(key);
        if(list != null && list.size() > 0){
            //如果存在，直接返回，无须查询数据库
            return Result.success(list);
        }
        ////////////////////////////////////////////////////////
        Dish dish = new Dish();
        dish.setCategoryId(categoryId);
        dish.setStatus(StatusConstant.ENABLE);//查询起售中的菜品

        //如果不存在，查询数据库，将查询到的数据放入redis中
        list = dishService.listWithFlavor(dish);
        ////////////////////////////////////////////////////////
        redisTemplate.opsForValue().set(key, list);

        return Result.success(list);
    }
```

为了保证**数据库**和**Redis**中的数据保持一致，修改**管理端接口 DishController** 的相关方法，加入清理缓存逻辑。

> 问题：苍穹外卖Redis加在了controller层，一般开发过程中是怎么分层的
>
> 在标准的 Java 后端开发规范中，**缓存逻辑（Redis）通常不应该写在 Controller 层，而应该下沉到 Service 层。**
>
> 苍穹外卖为了教学直观，把 Redis 代码直接写在了 Controller 里，这属于**教学简化**。但在实际企业开发中，如果把缓存、事务、业务判断全塞进 Controller，代码会极其臃肿且难以复用。
>

一、 三层架构的职责划分（核心原则）

| 层级 | 职责 | 绝对不要做的事 |
| --- | --- | --- |
| **Controller（表现层）** | 接收 HTTP 请求、解析参数、校验基础格式、调用 Service、封装统一返回结果（`Result`<br/>）。 | 不写业务逻辑、不直接调 Mapper、不写缓存、不写事务。 |
| **Service（业务逻辑层）** | 核心业务编排、事务控制（`@Transactional`<br/>）、缓存读写、调用多个 Mapper 组合数据、组装 VO/DTO。 | 不直接接触 `HttpServletRequest`<br/>、不返回 `Result`<br/>（返回纯业务对象）。 |
| **Mapper（数据访问层）** | 只负责与数据库交互，执行 CRUD。 | 不写业务判断（如 `if (status == 1)`<br/>）、不调其他 Service、不写缓存。 |


**一句话记忆**：

+ **Controller**：接待员（接客、传话、送客）。
+ **Service**：大厨（炒菜、配料、把控火候）。
+ **Mapper**：仓库管理员（只管从仓库拿货、放货）。
+ Controller 只处理 HTTP，Service 只处理业务，Mapper 只处理 SQL。



需要改造的方法：

+ 新增菜品
+ 修改菜品
+ 批量删除菜品
+ 起售、停售菜品

**抽取清理缓存的方法：**

在管理端DishController中添加

```java
    @Autowired
    private RedisTemplate redisTemplate;
    /**
     * 清理缓存数据
     * @param pattern
     */
    private void cleanCache(String pattern){
        Set keys = redisTemplate.keys(pattern);
        redisTemplate.delete(keys);
    }
```

>  在实际开发中，`**redisTemplate.keys(pattern)**`** 是一个被严令禁止的操作**！
>
> + `keys` 命令会阻塞 Redis 线程，导致其他请求全部卡死（Redis 是单线程的）。
> + 企业里如果非要批量删除，通常用 `SCAN` 命令渐进式删除，或者维护一个缓存字典。而最好的办法，就是**把粒度控制好，根本不需要批量删除**。
>

**调用清理缓存的方法，保证数据一致性：**

**1). 新增菜品优化**

```java
    /**
     * 新增菜品
     *
     * @param dishDTO
     * @return
     */
    @PostMapping
    @ApiOperation("新增菜品")
    public Result save(@RequestBody DishDTO dishDTO) {
        log.info("新增菜品：{}", dishDTO);
        dishService.saveWithFlavor(dishDTO);

        //清理缓存数据
        String key = "dish_" + dishDTO.getCategoryId();
        cleanCache(key);
        return Result.success();
    }
```

**2). 菜品批量删除优化**

```java
    /**
     * 菜品批量删除
     *
     * @param ids
     * @return
     */
    @DeleteMapping
    @ApiOperation("菜品批量删除")
    public Result delete(@RequestParam List<Long> ids) {
        log.info("菜品批量删除：{}", ids);
        dishService.deleteBatch(ids);

        //将所有的菜品缓存数据清理掉，所有以dish_开头的key
        cleanCache("dish_*");

        return Result.success();
    }
```

**3). 修改菜品优化**

```java
    /**
     * 修改菜品
     *
     * @param dishDTO
     * @return
     */
    @PutMapping
    @ApiOperation("修改菜品")
    public Result update(@RequestBody DishDTO dishDTO) {
        log.info("修改菜品：{}", dishDTO);
        dishService.updateWithFlavor(dishDTO);

        //将所有的菜品缓存数据清理掉，所有以dish_开头的key
        cleanCache("dish_*");

        return Result.success();
    }
```

**4). 菜品起售停售优化**

```java
    /**
     * 菜品起售停售
     *
     * @param status
     * @param id
     * @return
     */
    @PostMapping("/status/{status}")
    @ApiOperation("菜品起售停售")
    public Result<String> startOrStop(@PathVariable Integer status, Long id) {
        dishService.startOrStop(status, id);

        //将所有的菜品缓存数据清理掉，所有以dish_开头的key
        cleanCache("dish_*");

        return Result.success();
    }
```

> 问题：苍穹外卖里基本上增删改都是直接清理 所有菜品缓存，符合真实开发场景吗
>
> **“更新数据库后删除缓存”的宏观思路是对的，但“直接清理所有菜品缓存（**`**dish_***`**）”的粒度太粗，在生产环境是极其危险的。**  
 
>
> 为什么“全量清理”在真实场景很危险？
>
> 1. **缓存雪崩（Cache Avalanche）**  
你正在搞大促，用户疯狂浏览菜品。此时后台管理员修改了“宫保鸡丁”的价格。  
代码执行 `cleanCache("dish_*")`，**瞬间把 Redis 里所有分类的菜品缓存全删了**。  
成千上万的用户请求瞬间全部打到 MySQL 数据库上，数据库可能直接被打挂，整个系统崩溃。
> 2. **性能浪费**  
分类 1 到 分类 20 的菜品缓存明明没变，就因为改了分类 1 里的一道菜，全部被清空。下次有人查分类 2，还得重新查库、重新写缓存。
>
> 如果你在面试时被问到“苍穹外卖是怎么做缓存清理的”，你可以这样回答：
>
> “苍穹外卖为了教学方便，采用了全量清理 `dish_*` 的方式，这在实际开发中是不合理的，容易引发缓存雪崩。  
在实际生产中，我会采用 **Cache Aside Pattern（旁路缓存模式）**，**先更新数据库，再删除缓存**。并且我会把缓存粒度控制在 `dish_{categoryId}`，只清理受影响的分类。如果涉及分类变更，会同时清除新旧两个分类的缓存。  
此外，为了应对并发下的缓存一致性问题，我还会给缓存设置**随机过期时间**，或者采用**延时双删**策略，防止旧数据被并发读回 Redis。”
>

### 1.4 功能测试
> 直接用的讲义的截图，没有测试
>

可以通过如下方式进行测试： 

+ 查看控制台sql
+ 前后端联调
+ 查看Redis中的缓存数据

以**加入缓存**、**菜品修改**两个功能测试为例，通过前后端联调方式，查看控制台sql的打印和Redis中的缓存数据变化。



**1). 加入缓存**

当第一次查询某个分类的菜品时，会从数据为中进行查询，同时将查询的结果存储到Redis中，在后绪的访问，若查询相同分类的菜品时，直接从Redis缓存中查询，不再查询数据库。

**登录小程序：**选择蜀味牛蛙(id=17)

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791893050298-e8cb7757-ba2a-4e1e-8044-6ab5c2a27f67.png)

**查看控制台sql：**有查询语句，说明是从数据库中进行查询

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791893063674-ef9d3856-9c2c-48fc-a20d-4610cbe94dbc.png)

**查看Redis中的缓存数据：**说明缓存成功

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791893071132-9e7a0857-29e2-41f5-967d-860fac1fd020.png)

**再次访问：**选择蜀味牛蛙(id=17)

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791893080176-3bfcc2cb-3472-4d8e-9816-2ece536b369b.png)

说明是从Redis中查询的数据。



**2). 菜品修改**

当在后台修改菜品数据时，为了保证Redis缓存中的数据和数据库中的数据时刻保持一致，当修改后，需要清空对应的缓存数据。用户再次访问时，还是先从数据库中查询，同时再把查询的结果存储到Redis中，这样，就能保证缓存和数据库的数据保持一致。

**进入后台：**修改蜀味牛蛙分类下的任意一个菜品，当前分类的菜品数据已在Redis中缓存

**修改：**

**查看Redis中的缓存数据：**说明修改时，已清空缓存

用户再次访问同一个菜品分类时，需要先查询数据库，再把结果同步到Redis中，保证了两者数据一致性。

其它功能测试步骤基本一致，自已测试即可。

## 2. 缓存套餐
### 2.1 Spring Cache
#### 2.1.1 介绍
Spring Cache 是一个框架，实现了基于注解的缓存功能，只需要简单地加一个注解，就能实现缓存功能。

Spring Cache 提供了一层抽象，底层可以切换不同的缓存实现，例如：

+ EHCache
+ Caffeine
+ Redis(常用)

**起步依赖：**

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-cache</artifactId>  		            		       	 <version>2.7.3</version> 
</dependency>

```



#### 2.1.2 常用注解
在SpringCache中提供了很多缓存操作的注解，常见的是以下的几个：

| **注解** | **说明** |
| --- | --- |
| @EnableCaching | 开启缓存注解功能，通常加在启动类上 |
| @Cacheable | 在方法执行前先查询缓存中是否有数据，如果有数据，则直接返回缓存数据；如果没有缓存数据，调用方法并将方法返回值放到缓存中 |
| @CachePut | 将方法的返回值放到缓存中 |
| @CacheEvict | 将一条或多条数据从缓存中删除 |


在spring boot项目中，使用缓存技术只需在项目中导入相关缓存技术的依赖包，并在启动类上使用@EnableCaching开启缓存支持即可。

例如，使用Redis作为缓存技术，只需要导入Spring data Redis的maven坐标即可。



#### 2.1.3 入门案例
**1). 环境准备**

**导入基础工程:**底层已使用Redis缓存实现

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791893296072-b007a772-6052-4a44-99ef-037daca31ade.png)

基础环境的代码，在我们今天的资料中已经准备好了， 大家只需要将这个工程导入进来就可以了。导入进来的工程结构如下： 

**数据库准备:**

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791893464926-51c7a0d7-dad6-4817-ac6a-cfb42f0cb4a1.png)<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791894221580-c6debc4f-eeea-4377-bb2d-c932c4892ae2.png)

创建名为spring_cache_demo数据库，将springcachedemo.sql脚本直接导入数据库中。(需要手动创建spring_cache_demo数据库)

**引导类上加@EnableCaching:**

```java
package com.itheima;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@Slf4j
@SpringBootApplication
@EnableCaching//开启缓存注解功能
public class CacheDemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(CacheDemoApplication.class,args);
        log.info("项目启动成功...");
    }
}
```



**2). @CachePut注解**

**@CachePut 说明：** 

	作用: 将方法返回值，放入缓存

	value: 缓存的名称, 每个缓存名称下面可以有很多key

	key: 缓存的key  ----------> 支持Spring的表达式语言SPEL语法



**在save方法上加注解@CachePut**

当前UserController的save方法是用来保存用户信息的，我们希望在该用户信息保存到数据库的同时，也往缓存中缓存一份数据，我们可以在save方法上加上注解 @CachePut，用法如下：

```java
    /**
    * CachePut：将方法返回值放入缓存
    * value：缓存的名称，每个缓存名称下面可以有多个key
    * key：缓存的key
    */
    @PostMapping
    @CachePut(value = "userCache", key = "#user.id")//key的生成：userCache::1
    public User save(@RequestBody User user){
        userMapper.insert(user);
        return user;
    }
```

**说明：**key的写法如下

#user.id : #user指的是方法形参的名称, id指的是user的id属性 , 也就是使用user的id属性作为key ;

#result.id : #result代表方法返回值，该表达式 代表以返回对象的id属性作为key ；

#p0.id：#p0指的是方法中的第一个参数，id指的是第一个参数的id属性,也就是使用第一个参数的id属性作为key ;

#a0.id：#a0指的是方法中的第一个参数，id指的是第一个参数的id属性,也就是使用第一个参数的id属性作为key ;

#root.args[0].id:#root.args[0]指的是方法中的第一个参数，id指的是第一个参数的id属性,也就是使用第一个参数

的id属性作为key ;

**启动服务,通过swagger接口文档测试，访问UserController的save()方法（启动的是spring_cache_demo服务，swagger接口文档端口记得改为 8888）**

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791894310626-8d8b68a3-f3da-4d05-bbfd-04ba7715a6c3.png)



因为id是自增，所以不需要设置id属性



**查看user表中的数据**<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791894370549-6b5716d1-710a-4ab5-8a25-6d82c1c394ac.png)

**查看Redis中的数据（没下载可视化的，在终端查看）**

> 我的没看到Redis里面有
>
> <!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791894785956-ba42c09e-5f94-45fa-8c6a-8463e388cee6.png)
>
> 检查代码，发现没有相关注释
>
> <!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791895795141-b47519a0-8add-4e32-ba43-7d5867423ce0.png)
>
> 添加后依然看不到Redis里面有数据，问了AI，提到检查连接的数据库
>
> <!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791895835928-1f9fd142-7c82-4aa4-939c-5fb5ca958ff1.png)
>
> 配置里面database是1 ，需要切换指令
>

> 切换Redis 默认有 16 个数据库（0~15）。连接时指定 database 即可。
>
> **1. 直接连接 DB1（推荐）**  
在终端输入：
>
> redis-cli -h localhost -p 6379 -n 1
>
> <!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791895751235-0f6a1bc3-0f7d-4189-95cd-cd50a2dd0faf.png)
>

**3). @Cacheable注解**

**@Cacheable 说明:**

	作用: 在方法执行前，spring先查看缓存中是否有数据，如果有数据，则直接返回缓存数据；若没有数据，调用方法并将方法返回值放到缓存中

	value: 缓存的名称，每个缓存名称下面可以有多个key

	key: 缓存的key  ----------> 支持Spring的表达式语言SPEL语法



 **在getById上加注解@Cacheable**

```java
    /**
    * Cacheable：在方法执行前spring先查看缓存中是否有数据，如果有数据，则直接返回缓存数据；若没有数据，	  *调用方法并将方法返回值放到缓存中
    * value：缓存的名称，每个缓存名称下面可以有多个key
    * key：缓存的key
    */
    @GetMapping
    @Cacheable(cacheNames = "userCache",key="#id")
    public User getById(Long id){
        User user = userMapper.getById(id);
        return user;
    }
```

**重启服务,通过swagger接口文档测试，访问UserController的getById()方法**

第一次访问，会请求我们controller的方法，查询数据库。后面再查询相同的id，就直接从Redis中查询数据，不用再查询数据库了，就说明缓存生效了。

提前在redis中手动删除掉id=1的用户数据

**查看控制台sql语句：**说明从数据库查询的用户数据

**查看Redis中的缓存数据：**说明已成功缓存

再次查询相同id的数据时，直接从redis中直接获取，不再查询数据库。



**4). @CacheEvict注解**

**@CacheEvict 说明：** 

	作用: 清理指定缓存

	value: 缓存的名称，每个缓存名称下面可以有多个key

	key: 缓存的key  ----------> 支持Spring的表达式语言SPEL语法



**在 delete 方法上加注解@CacheEvict**

```java
    @DeleteMapping
    @CacheEvict(cacheNames = "userCache",key = "#id")//删除某个key对应的缓存数据
    public void deleteById(Long id){
        userMapper.deleteById(id);
    }

    @DeleteMapping("/delAll")
    @CacheEvict(cacheNames = "userCache",allEntries = true)//删除userCache下所有的缓存数据
    public void deleteAll(){
        userMapper.deleteAll();
    }
```

**重启服务,通过swagger接口文档测试，访问UserController的deleteAll()方法**

**查看user表：**数据清空

**查询Redis缓存数据**

### 2.2 实现思路
**实现步骤：**

1). 导入Spring Cache和Redis相关maven坐标

2). 在启动类上加入@EnableCaching注解，开启缓存注解功能

3). 在用户端接口SetmealController的 list 方法上加入@Cacheable注解

4). 在管理端接口SetmealController的 save、delete、update、startOrStop等方法上加入CacheEvict注解



### 2.3 代码开发
按照上述实现步骤：

**1). 导入Spring Cache和Redis相关maven坐标(已实现)**

```xml
<dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
<dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-cache</artifactId>
</dependency>

```



**2). 在启动类上加入@EnableCaching注解，开启缓存注解功能**

```java
package com.sky;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication
@EnableTransactionManagement //开启注解方式的事务管理
@Slf4j
@EnableCaching
public class SkyApplication {
    public static void main(String[] args) {
        SpringApplication.run(SkyApplication.class, args);
        log.info("server started");
    }
}
```



**3). 在用户端接口SetmealController的 list 方法上加入@Cacheable注解**

```java
    /**
     * 条件查询
     *
     * @param categoryId
     * @return
     */
    @GetMapping("/list")
    @ApiOperation("根据分类id查询套餐")
    @Cacheable(cacheNames = "setmealCache",key = "#categoryId") //key: setmealCache::100
    public Result<List<Setmeal>> list(Long categoryId) {
        Setmeal setmeal = new Setmeal();
        setmeal.setCategoryId(categoryId);
        setmeal.setStatus(StatusConstant.ENABLE);

        List<Setmeal> list = setmealService.list(setmeal);
        return Result.success(list);
    }
```



**4). 在管理端接口SetmealController的 save、delete、update、startOrStop等方法上加入CacheEvict注解**

```java
    /**
     * 新增套餐
     *
     * @param setmealDTO
     * @return
     */
    @PostMapping
    @ApiOperation("新增套餐")
    @CacheEvict(cacheNames = "setmealCache",key = "#setmealDTO.categoryId")//key: setmealCache::100
    public Result save(@RequestBody SetmealDTO setmealDTO) {
        setmealService.saveWithDish(setmealDTO);
        return Result.success();
    }
    /**
     * 批量删除套餐
     *
     * @param ids
     * @return
     */
    @DeleteMapping
    @ApiOperation("批量删除套餐")
    @CacheEvict(cacheNames = "setmealCache",allEntries = true)
    public Result delete(@RequestParam List<Long> ids) {
        setmealService.deleteBatch(ids);
        return Result.success();
    }
    /**
     * 修改套餐
     *
     * @param setmealDTO
     * @return
     */
    @PutMapping
    @ApiOperation("修改套餐")
    @CacheEvict(cacheNames = "setmealCache",allEntries = true)
    public Result update(@RequestBody SetmealDTO setmealDTO) {
        setmealService.update(setmealDTO);
        return Result.success();
    }

    /**
     * 套餐起售停售
     *
     * @param status
     * @param id
     * @return
     */
    @PostMapping("/status/{status}")
    @ApiOperation("套餐起售停售")
    @CacheEvict(cacheNames = "setmealCache",allEntries = true)
    public Result startOrStop(@PathVariable Integer status, Long id) {
        setmealService.startOrStop(status, id);
        return Result.success();
    }
```



### 2.4 功能测试
通过前后端联调方式来进行测试，同时观察redis中缓存的套餐数据。和**缓存菜品**功能测试基本一致，不再赘述。



## 3. 添加购物车
### 3.1 需求分析和设计
#### 3.1.1 产品原型
用户可以将菜品或者套餐添加到购物车。对于菜品来说，如果设置了口味信息，则需要选择规格后才能加入购物车;对于套餐来说，可以直接点击将当前套餐加入购物车。在购物车中可以修改菜品和套餐的数量，也可以清空购物车。

**效果图：**

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791896004901-950eb362-da97-41ed-9c57-f86cd6ae425f.png)

#### 3.1.2 接口设计
通过上述原型图，设计出对应的添加购物车接口。

 <!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791896331515-c6cfbfb6-2871-481e-af80-dc0a9d15385e.png)<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791896341723-b3e95f05-6590-477a-95d5-ebfc784d8339.png)

**说明：**添加购物车时，有可能添加菜品，也有可能添加套餐。故传入参数要么是菜品id，要么是套餐id。



#### 3.1.3 表设计
用户的购物车数据，也是需要保存在数据库中的，购物车对应的数据表为shopping_cart表，具体表结构如下：

| **字段名** | **数据类型** | **说明** | **备注** |
| --- | --- | --- | --- |
| id | bigint | 主键 | 自增 |
| name | varchar(32) | 商品名称 | 冗余字段 |
| image | varchar(255) | 商品图片路径 | 冗余字段 |
| user_id | bigint | 用户id | 逻辑外键 |
| dish_id | bigint | 菜品id | 逻辑外键 |
| setmeal_id | bigint | 套餐id | 逻辑外键 |
| dish_flavor | varchar(50) | 菜品口味 |  |
| number | int | 商品数量 |  |
| amount | decimal(10,2) | 商品单价 | 冗余字段 |
| create_time | datetime | 创建时间 |  |


**说明：** 

+ 购物车数据是关联用户的，在表结构中，我们需要记录，每一个用户的购物车数据是哪些
+ 菜品列表展示出来的既有套餐，又有菜品，如果用户选择的是套餐，就保存套餐ID(setmeal_id)，如果用户选择的是菜品，就保存菜品ID(dish_id)
+ 对同一个菜品/套餐，如果选择多份不需要添加多条记录，增加数量number即可



### 3.2 代码开发
#### 3.2.1 DTO设计
**根据添加购物车接口的参数设计DTO：**

在sky-pojo模块，ShoppingCartDTO.java已定义

```java
package com.sky.dto;

import lombok.Data;
import java.io.Serializable;

@Data
public class ShoppingCartDTO implements Serializable {

    private Long dishId;
    private Long setmealId;
    private String dishFlavor;

}
```



#### 3.2.2 Controller层
**根据添加购物车接口创建ShoppingCartController：**

```java
package com.sky.controller.user;


import com.sky.dto.ShoppingCartDTO;
import com.sky.result.Result;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 购物车
 */
@RestController
@RequestMapping("/user/shoppingCart")
@Slf4j
@Api(tags = "C端-购物车接口")
public class ShoppingCartController {

    @Autowired
    private ShoppingCartService shoppingCartService;

    /**
     * 添加购物车
     * @param shoppingCartDTO
     * @return
     */
    @PostMapping("/add")
    @ApiOperation("添加购物车")
    public Result<String> add(@RequestBody ShoppingCartDTO shoppingCartDTO){
        log.info("添加购物车：{}", shoppingCartDTO);
        shoppingCartService.addShoppingCart(shoppingCartDTO);//后绪步骤实现
        return Result.success();
    }
}
```



#### 3.2.3 Service层接口
**创建ShoppingCartService接口：**

```java
package com.sky.service;

import com.sky.dto.ShoppingCartDTO;
import com.sky.entity.ShoppingCart;
import java.util.List;

public interface ShoppingCartService {

    /**
     * 添加购物车
     * @param shoppingCartDTO
     */
    void addShoppingCart(ShoppingCartDTO shoppingCartDTO);
}
```



#### 3.2.4 Service层实现类
**创建ShoppingCartServiceImpl实现类，并实现add方法：**

```java
package com.sky.service.impl;


import com.sky.context.BaseContext;
import com.sky.dto.ShoppingCartDTO;
import com.sky.entity.Dish;
import com.sky.entity.Setmeal;
import com.sky.entity.ShoppingCart;
import com.sky.mapper.DishMapper;
import com.sky.mapper.SetmealMapper;
import com.sky.service.ShoppingCartService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ShoppingCartServiceImpl implements ShoppingCartService {

    @Autowired
    private ShoppingCartMapper shoppingCartMapper;
    @Autowired
    private DishMapper dishMapper;
    @Autowired
    private SetmealMapper setmealMapper;
    
    /**
     * 添加购物车
     *
     * @param shoppingCartDTO
     */
    public void addShoppingCart(ShoppingCartDTO shoppingCartDTO) {
        ShoppingCart shoppingCart = new ShoppingCart();
        BeanUtils.copyProperties(shoppingCartDTO, shoppingCart);
        //只能查询自己的购物车数据
        shoppingCart.setUserId(BaseContext.getCurrentId());

        //判断当前商品是否在购物车中
        List<ShoppingCart> shoppingCartList = shoppingCartMapper.list(shoppingCart);

        if (shoppingCartList != null && shoppingCartList.size() == 1) {
            //如果已经存在，就更新数量，数量加1
            shoppingCart = shoppingCartList.get(0);
            shoppingCart.setNumber(shoppingCart.getNumber() + 1);
            shoppingCartMapper.updateNumberById(shoppingCart);
        } else {
            //如果不存在，插入数据，数量就是1

            //判断当前添加到购物车的是菜品还是套餐
            Long dishId = shoppingCartDTO.getDishId();
            if (dishId != null) {
                //添加到购物车的是菜品
                Dish dish = dishMapper.getById(dishId);
                shoppingCart.setName(dish.getName());
                shoppingCart.setImage(dish.getImage());
                shoppingCart.setAmount(dish.getPrice());
            } else {
                //添加到购物车的是套餐
                Setmeal setmeal = setmealMapper.getById(shoppingCartDTO.getSetmealId());
                shoppingCart.setName(setmeal.getName());
                shoppingCart.setImage(setmeal.getImage());
                shoppingCart.setAmount(setmeal.getPrice());
            }
            shoppingCart.setNumber(1);
            shoppingCart.setCreateTime(LocalDateTime.now());
            shoppingCartMapper.insert(shoppingCart);
        }
    }
}
```



#### 3.2.5 Mapper层
**创建ShoppingCartMapper接口:**

```java
package com.sky.mapper;

import com.sky.entity.ShoppingCart;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Update;
import java.util.List;

@Mapper
public interface ShoppingCartMapper {
    /**
     * 条件查询
     *
     * @param shoppingCart
     * @return
     */
    List<ShoppingCart> list(ShoppingCart shoppingCart);

    /**
     * 更新商品数量
     *
     * @param shoppingCart
     */
    @Update("update shopping_cart set number = #{number} where id = #{id}")
    void updateNumberById(ShoppingCart shoppingCart);

    /**
     * 插入购物车数据
     *
     * @param shoppingCart
     */
    @Insert("insert into shopping_cart (name, user_id, dish_id, setmeal_id, dish_flavor, number, amount, image, create_time) " +
            " values (#{name},#{userId},#{dishId},#{setmealId},#{dishFlavor},#{number},#{amount},#{image},#{createTime})")
    void insert(ShoppingCart shoppingCart);

}
```

**创建ShoppingCartMapper.xml：**

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd" >
<mapper namespace="com.sky.mapper.ShoppingCartMapper">
    <select id="list" parameterType="ShoppingCart" resultType="ShoppingCart">
        select * from shopping_cart
        <where>
            <if test="userId != null">
                and user_id = #{userId}
            </if>
            <if test="dishId != null">
                and dish_id = #{dishId}
            </if>
            <if test="setmealId != null">
                and setmeal_id = #{setmealId}
            </if>
            <if test="dishFlavor != null">
                and dish_flavor = #{dishFlavor}
            </if>
        </where>
        order by create_time desc
    </select>
</mapper>

```



### 3.3 功能测试
进入小程序，添加菜品

 

加入购物车，查询数据库

因为现在没有实现查看购物车功能，所以只能在表中进行查看。

在前后联调时，后台可通断点方式启动，查看运行的每一步。

## 4. 查看购物车
### 4.1 需求分析和设计
#### 4.1.1 产品原型
当用户添加完菜品和套餐后，可进入到购物车中，查看购物中的菜品和套餐。

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791896386169-9b85ac00-ca79-4a8d-9924-fd52d9a66567.png)

#### 4.1.2 接口设计
 <!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791896391983-9c51ca67-1d7c-4057-8a21-47a9bb861a11.png)<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791896397345-5e6bbc79-aeec-4e04-b5bd-b73490faea41.png)



### 4.2 代码开发
#### 4.2.1 Controller层
**在ShoppingCartController中创建查看购物车的方法：**

```java
    /**
     * 查看购物车
     * @return
     */
    @GetMapping("/list")
    @ApiOperation("查看购物车")
    public Result<List<ShoppingCart>> list(){
        return Result.success(shoppingCartService.showShoppingCart());
    }
```



#### 4.2.2 Service层接口
**在ShoppingCartService接口中声明查看购物车的方法：**

```java
    /**
     * 查看购物车
     * @return
     */
    List<ShoppingCart> showShoppingCart();
```



#### 4.2.3 Service层实现类
**在ShoppingCartServiceImpl中实现查看购物车的方法：**

```java
    /**
     * 查看购物车
     * @return
     */
    public List<ShoppingCart> showShoppingCart() {
        return shoppingCartMapper.list(ShoppingCart.
                                       builder().
                                       userId(BaseContext.getCurrentId()).
                                       build());
    }
```



### 4.3 功能测试
当进入小程序时，就会发起查看购物车的请求



点击购物车图标

测试成功。



## 5. 清空购物车
### 5.1 需求分析和设计
#### 5.1.1 产品原型
当点击清空按钮时，会把购物车中的数据全部清空。

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791896505087-0a9ad726-f358-4f2d-a98d-ac3398a33cf7.png)

#### 5.1.2 接口设计
<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791896514686-3e13db06-4c07-45ad-abb7-7eca3931a025.png)

### 5.2 代码开发
#### 5.2.1 Controller层
**在ShoppingCartController中创建清空购物车的方法：**

```java
/**
     * 清空购物车商品
     * @return
     */
    @DeleteMapping("/clean")
    @ApiOperation("清空购物车商品")
    public Result<String> clean(){
        shoppingCartService.cleanShoppingCart();
        return Result.success();
    }
```

#### 5.2.2 Service层接口
**在ShoppingCartService接口中声明清空购物车的方法：**

```java
/**
     * 清空购物车商品
     */
    void cleanShoppingCart();
```

#### 5.2.3 Service层实现类
**在ShoppingCartServiceImpl中实现清空购物车的方法：**

```java
/**
     * 清空购物车商品
     */
    public void cleanShoppingCart() {
        shoppingCartMapper.deleteByUserId(BaseContext.getCurrentId());
    }
```

#### 5.2.4 Mapper层
**在ShoppingCartMapper接口中创建删除购物车数据的方法：**

```java
/**
     * 根据用户id删除购物车数据
     *
     * @param userId
     */
    @Delete("delete from shopping_cart where user_id = #{userId}")
    void deleteByUserId(Long userId);
```

### 5.3 功能测试
进入到购物车页面

点击清空

查看数据库中的数据

说明当前用户的购物车数据已全部删除。

