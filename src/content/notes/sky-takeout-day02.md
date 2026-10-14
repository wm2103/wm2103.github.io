---
title: "苍穹外卖 Day 02：员工与分类管理"
description: "完成员工新增、分页查询、状态管理和编辑，记录异常处理、ThreadLocal、Lombok 与分类模块的学习过程。"
category: "web"
tags: ["Spring Boot","MyBatis","员工管理","苍穹外卖"]
cover: "sky"
importedAt: "2026-10-14"
series: "sky-takeout"
seriesOrder: 2
sourceLabel: "黑马程序员《苍穹外卖》课程学习笔记，含个人批注与调试记录"
---

## 课程内容
+ 新增员工
+ 员工分页查询
+ 启用禁用员工账号
+ 编辑员工
+ 导入分类模块功能代码



**功能实现：**员工管理、菜品分类管理。

**员工管理效果：（admin不能修改）**

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791277326609-381ef4c2-037c-45e6-a84f-6e6809d3bb1c.png)

**菜品分类管理效果：(常见的增删改查)**

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791426698822-3f2942a0-e2cb-4bf9-b25b-8e18064a87cd.png)

## 1. 新增员工
### 1.1 需求分析和设计
#### 1.1.1 产品原型
一般在做需求分析时，往往都是对照着产品原型进行分析，因为产品原型比较直观，便于我们理解业务。

后台系统中可以管理员工信息，通过新增员工来添加后台系统用户。

**新增员工原型：**

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791427266289-7c47531a-6eef-4a4d-8eff-399a7a54ac23.png)

当填写完表单信息, 点击"保存"按钮后, 会提交该表单的数据到服务端, 在服务端中需要接受数据, 然后将数据保存至数据库中。

**注意事项：**

1. 账号必须是唯一的
2. 手机号为合法的11位手机号码
3. 身份证号为合法的18位身份证号码
4. 密码默认为123456



#### 1.1.2 接口设计
找到资料-->项目接口文档-->苍穹外卖-管理端接口.html

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791427374266-6bdd58ee-c7e0-4803-ba68-99cfcad5eddd.png)

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791427391950-35c6bc3e-451a-4ce5-bc55-456a1406aa17.png)

明确新增员工接口的**请求路径、请求方式、请求参数、返回数据**。

本项目约定：

+ **管理端**发出的请求，统一使用**/admin**作为前缀。
+ **用户端**发出的请求，统一使用**/user**作为前缀。



#### 1.1.3 表设计
新增员工，其实就是将我们新增页面录入的员工数据插入到employee表。

**employee表结构：**

| **字段名** | **数据类型** | **说明** | **备注** |
| --- | --- | --- | --- |
| id | bigint | 主键 | 自增 |
| name | varchar(32) | 姓名 |  |
| username | varchar(32) | 用户名 | 唯一 |
| password | varchar(64) | 密码 |  |
| phone | varchar(11) | 手机号 |  |
| sex | varchar(2) | 性别 |  |
| id_number | varchar(18) | 身份证号 |  |
| status | Int | 账号状态 | 1正常 0锁定 |
| create_time | Datetime | 创建时间 |  |
| update_time | datetime | 最后修改时间 |  |
| create_user | bigint | 创建人id |  |
| update_user | bigint | 最后修改人id |  |


其中，employee表中的status字段已经设置了默认值1，表示状态正常。

### 1.2 代码开发
#### 1.2.1 设计DTO类 （DTO 数据传输对象 通常前端传给后端）
**根据新增员工接口设计对应的DTO**

前端传递参数列表：

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791427627983-dd1cfd1a-c982-4222-9bef-82eee3a5b91c.png)

**思考：**是否可以使用对应的实体类来接收呢？（缺失了一些属性）

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791427667087-cdd36e07-6304-40b5-8ea8-3343a58378e9.png)

**注意：**当前端提交的数据和实体类中对应的属性差别比较大时，建议使用DTO来封装数据

由于上述传入参数和实体类有较大差别，所以自定义DTO类。

进入sky-pojo模块，在com.sky.dto包下，已定义EmployeeDTO

```java
package com.sky.dto;

import lombok.Data;

import java.io.Serializable;

@Data
public class EmployeeDTO implements Serializable {

    private Long id;

    private String username;

    private String name;

    private String phone;

    private String sex;

    private String idNumber;

}
```

> 问题： implements Serializable 是什么，有什么用？
>
> + **序列化**：把 Java 对象（在内存里）变成**二进制字节流**（比如可以写进文件、数据库，或者通过网络发送）。
> + **反序列化**：把二进制字节流**恢复成 Java 对象**。
> + **Serializable 接口**：它是一个**空接口（标记接口）**，里面没有任何方法。它的唯一作用就是告诉 JVM：“这个类的对象允许被序列化”。如果不实现它，你尝试把对象写入流（比如 `ObjectOutputStream`），程序会直接抛出 `NotSerializableException`。
>
> ### 在苍穹外卖里，为什么 DTO 要加它？
> 虽然前端发来的 JSON 数据是文本，但在后端流转的过程中，对象可能会经历以下场景，这些都要求对象必须实现 `Serializable`：
>
> 1. **存入 Redis 缓存（最核心的原因）**：  
苍穹外卖中很多数据会缓存到 Redis（比如菜品分类、用户信息）。如果你要把 `EmployeeDTO` 或类似的对象直接存入 Redis，Redis 的默认序列化机制（通常是 JDK 原生序列化）或某些 Spring Cache 机制，要求该对象必须实现 `Serializable`。
> 2. **微服务或 RPC 调用**：  
如果项目以后拆分为微服务，模块之间通过 Dubbo、Feign 等进行远程调用，传递的对象必须实现 `Serializable`。
> 3. **Tomcat 的 Session 钝化**：  
如果服务器重启，Tomcat 会把 Session 里的对象临时写入磁盘（钝化），重启后再读回内存（活化）。这要求 Session 里的对象必须可序列化。
> 4. **企业开发规范**：  
在阿里等大厂的 Java 开发手册中，强烈建议**只要是 POJO（包括 DTO、VO、Entity），一律实现 **`**Serializable**`** 接口**。这属于一种防御性编程，避免未来更换缓存框架或引入新组件时踩坑。
>

#### 1.2.2 Controller层
 **EmployeeController中创建新增员工方法**

进入到sky-server模块中，在com.sky.controller.admin包下，在EmployeeController中创建新增员工方法，接收前端提交的参数。

```java
    /**
     * 新增员工
     * @param employeeDTO
     * @return
     */
    @PostMapping
    @ApiOperation("新增员工") 
    public Result save(@RequestBody EmployeeDTO employeeDTO){
        log.info("新增员工：{}",employeeDTO);
        employeeService.save(employeeDTO);//该方法后续步骤会定义
        return Result.success();
    }
```

> `@ApiOperation("新增员工")` 是 **Swagger（或 Knife4j）框架的注解**，它的唯一作用是：**给这个接口生成在线接口文档时，加上一个清晰的说明文字。**
>

**注：**Result类定义了后端统一返回结果格式。

进入sky-common模块，在com.sky.result包下定义了Result.java

```java
package com.sky.result;

import lombok.Data;

import java.io.Serializable;

/**
 * 后端统一返回结果
 * @param <T>
 */
@Data
public class Result<T> implements Serializable {

    private Integer code; //编码：1成功，0和其它数字为失败
    private String msg; //错误信息
    private T data; //数据

    public static <T> Result<T> success() {
        Result<T> result = new Result<T>();
        result.code = 1;
        return result;
    }

    public static <T> Result<T> success(T object) {
        Result<T> result = new Result<T>();
        result.data = object;
        result.code = 1;
        return result;
    }

    public static <T> Result<T> error(String msg) {
        Result result = new Result();
        result.msg = msg;
        result.code = 0;
        return result;
    }

}
```

> `<T>` 表示 **泛型（Generics）**，`T` 就是 **Type（类型）** 的缩写。它代表“**任意类型**”。
>
> 在 `Result<T>` 里，`T` 是一个**类型占位符**。它让 `Result` 这个类变得非常灵活，可以封装任何类型的返回数据，而不需要为每种数据类型都写一个 Result 类。
>
> **如果没有泛型**，你的 `Result` 类里的 `data` 字段只能写成 `Object`：
>
> 
>

```plain
public class Result {
    private Integer code;
    private String msg;
    private Object data; // 只能用Object接收一切
}
```

如果是这样，前端拿到数据后，或者你后续再去取 `data` 时，必须强制类型转换：

```plain
Result result = ...;
// 强转，容易出ClassCastException
EmployeeLoginVO vo = (EmployeeLoginVO) result.getData();
```

**有了泛型 **`**<T>**`** 之后**：

```plain
Result<EmployeeLoginVO> result = Result.success(employeeLoginVO);
EmployeeLoginVO vo = result.getData(); // 直接拿，不需要强转，编译期就确定类型
```

这样既安全（编译期检查类型），又优雅。

#### 1.2.3 Service层接口
**在EmployeeService接口中声明新增员工方法**

进入到sky-server模块中,com.sky.server.EmployeeService

```java
    /**
     * 新增员工
     * @param employeeDTO
     */
    void save(EmployeeDTO employeeDTO);
```

#### 1.2.4 Service层实现类
**在EmployeeServiceImpl中实现新增员工方法**

com.sky.server.impl.EmployeeServiceImpl中创建方法

```java
    /**
     * 新增员工
     *
     * @param employeeDTO
     */
    public void save(EmployeeDTO employeeDTO) {
        Employee employee = new Employee();

        //对象属性拷贝
        BeanUtils.copyProperties(employeeDTO, employee);

        //设置账号的状态，默认正常状态 1表示正常 0表示锁定
        employee.setStatus(StatusConstant.ENABLE);

        //设置密码，默认密码123456
        employee.setPassword(DigestUtils.md5DigestAsHex(PasswordConstant.DEFAULT_PASSWORD.getBytes()));

        //设置当前记录的创建时间和修改时间
        employee.setCreateTime(LocalDateTime.now());
        employee.setUpdateTime(LocalDateTime.now());

        //设置当前记录创建人id和修改人id
        employee.setCreateUser(10L);//目前写个假数据，后期修改
        employee.setUpdateUser(10L);

        employeeMapper.insert(employee);//后续步骤定义
    }
```



在sky-common模块com.sky.constants包下已定义StatusConstant.java

```java
package com.sky.constant;

/**
 * 状态常量，启用或者禁用
 */
public class StatusConstant {

    //启用
    public static final Integer ENABLE = 1;

    //禁用
    public static final Integer DISABLE = 0;
}

```

#### 1.2.5 Mapper层
**在EmployeeMapper中声明insert方法**

com.sky.EmployeeMapper中添加方法

```java
    /**
     * 插入员工数据
     * @param employee
     */
    @Insert("insert into employee (name, username, password, phone, sex, id_number, create_time, update_time, create_user, update_user,status) " +
            "values " +
            "(#{name},#{username},#{password},#{phone},#{sex},#{idNumber},#{createTime},#{updateTime},#{createUser},#{updateUser},#{status})")
    void insert(Employee employee);
```

在application.yml中已开启驼峰命名，故id_number和idNumber可对应。

```yaml
mybatis:
  configuration:
    #开启驼峰命名
    map-underscore-to-camel-case: true
```

### 1.3 功能测试
代码已经发开发完毕，对新增员工功能进行测试。

**功能测试实现方式：**

+ 通过接口文档测试
+ 通前后端联调测试

接下来我们使用上述两种方式分别测试。



#### 1.3.1 接口文档测试
**启动服务：**访问[http://localhost:8080/doc.html](about:blank)，进入新增员工接口

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791428615853-902b2129-b9b4-42f1-a9a8-c03040502149.png)

json数据：

```json
{
  "id": 0,
  "idNumber": "111222333444555666",
  "name": "xiaozhi",
  "phone": "13812344321",
  "sex": "1",
  "username": "小智"
}
```

响应码：401 报错

> 后端日志
>

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791428667708-a7a73204-090e-401c-8458-d9808fc22c37.png)

**通过断点调试：**进入到JwtTokenAdminInterceptor拦截器

```java
     /**
     * 校验jwt
     *
     * @param request
     * @param response
     * @param handler
     * @return
     * @throws Exception
     */
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        //判断当前拦截到的是Controller的方法还是其他资源
        if (!(handler instanceof HandlerMethod)) {
            //当前拦截到的不是动态方法，直接放行
            return true;
        }

        //1、从请求头中获取令牌 jwtProperties.getAdminTokenName()获取为token
        String token = request.getHeader(jwtProperties.getAdminTokenName());

        //2、校验令牌
        try {
            log.info("jwt校验:{}", token);
            Claims claims = JwtUtil.parseJWT(jwtProperties.getAdminSecretKey(), token);
            Long empId = Long.valueOf(claims.get(JwtClaimsConstant.EMP_ID).toString());
            log.info("当前员工id：", empId);
            //3、通过，放行
            return true;
        } catch (Exception ex) {
            //4、不通过，响应401状态码
            response.setStatus(401);
            return false;
        }
    }
```

**报错原因：**由于JWT令牌校验失败，导致EmployeeController的save方法没有被调用

**解决方法：**调用员工登录接口获得一个合法的JWT令牌

使用admin用户登录获取令牌

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791428767322-91e0f812-4c29-44a5-b08b-636e7b744943.png)

**添加令牌：**

将合法的JWT令牌添加到全局参数中

文档管理-->全局参数设置-->添加参数

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791428823630-4055b69e-8932-4446-bdb0-969ec41b50e5.png)

**接口测试：**

其中，请求头部含有JWT令牌(要刷新重新进新增员工的调试界面，显示请求头部有token才可以)

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791428891784-ba04b074-f5f7-4437-b27c-2c8ce214e8f9.png)<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791428975359-be857893-3b16-4a6c-bebf-4fe41c0fd64d.png)

**查看employee表：**

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791429019935-f4d7e993-d7dd-439b-8b53-46838640d4bc.png)

测试成功。



#### 1.3.2 前后端联调测试
启动nginx,访问 http://localhost:80

登录-->员工管理-->添加员工<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791429129657-82fe6064-5282-49da-87b7-174e92221025.png)

保存后，查看employee表

测试成功。



**注意：**由于开发阶段前端和后端是并行开发的，后端完成某个功能后，此时前端对应的功能可能还没有开发完成，  
导致无法进行前后端联调测试。所以在开发阶段，后端测试主要以接口文档测试为主。



### 1.4 代码完善
目前，程序存在的问题主要有两个：

+ 录入的用户名已存，抛出的异常后没有处理
+ 新增员工时，创建人id和修改人id设置为固定值

接下来，我们对上述两个问题依次进行分析和解决。

#### 1.4.1 问题一 （可惜拿到的代码已经处理了这个问题）
**描述：**录入的用户名已存，抛出的异常后没有处理

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791429365296-4c76800d-971e-4c25-8dc4-1e784be567b7.png)

**分析：**

新增username=zhangsan的用户，若employee表中之前已存在。

后台报错信息：

查看employee表结构：

发现，username已经添加了唯一约束，不能重复。

**解决：**

通过全局异常处理器来处理。

进入到sky-server模块，com.sky.hander包下，GlobalExceptionHandler.java添加方法

```java
    /**
     * 处理SQL异常
     * @param ex
     * @return
     */
    @ExceptionHandler
    public Result exceptionHandler(SQLIntegrityConstraintViolationException ex){
        //Duplicate entry 'zhangsan' for key 'employee.idx_username'
        String message = ex.getMessage();
        if(message.contains("Duplicate entry")){
            String[] split = message.split(" ");
            String username = split[2];
            String msg = username + MessageConstant.ALREADY_EXISTS;
            return Result.error(msg);
        }else{
            return Result.error(MessageConstant.UNKNOWN_ERROR);
        }
    }
```

> 讲解这段代码：
>
> 要理解这段代码，首先要明白 Spring Boot 的异常处理流转：
>
> 1. **触发场景**：管理员在后台点击“新增员工”，输入了用户名 `zhangsan`。
> 2. **业务执行**：Controller 接收请求，调用 Service，Service 调用 Mapper，准备往数据库 `employee` 表插入数据。
> 3. **数据库报错**：由于 `employee` 表的 `username` 字段建了**唯一索引**（`idx_username`），数据库发现 `zhangsan` 已经存在，于是拒绝插入，并抛出 `SQLIntegrityConstraintViolationException` 异常。
> 4. **异常向上抛出**：这个异常会顺着 Mapper -> Service -> Controller 往外抛。
> 5. **全局拦截**：Spring MVC 发现抛出了异常，会去寻找带有 `@ExceptionHandler` 注解的方法。因为类上加了这个注解的方法，这个异常就被拦截到了。
> 6. **解析并返回**：方法内部解析异常信息，返回一个 `Result.error(msg)`，Spring 自动将其转为 JSON 响应给前端。
>
> 💡 **注意**：包含这个方法的类，必须在类头上加 `@RestControllerAdvice` 或 `@ControllerAdvice` 注解，它才会生效成为“全局异常处理器”。
>
> `@ExceptionHandler` 告诉 Spring：“只要项目里抛出了 `SQLIntegrityConstraintViolationException`（SQL完整性约束违规异常），就交给我这个方法处理。”
>
> `ex.getMessage()` 拿到的是 MySQL 原生报错信息。注释里给出了示例，这是 MySQL 非常标准的报错格式。
>
> 如果是其他 SQL 异常（比如外键约束），消息里不会有 `Duplicate entry`（重复条目），直接进入 `else` 分支，返回“未知错误”。
>
> 利用空格对报错信息进行切割。  
以 `Duplicate entry 'zhangsan' for key 'employee.idx_username'` 为例：
>
> + `split[0]` = `Duplicate`
> + `split[1]` = `entry`
> + `split[2]` = `'zhangsan'` （**注意：这里带有单引号**）
> + `split[3]` = `for`
> + ...
>
> ### 更好的替代写法（Spring 进阶）
> 在 Spring Boot 中，更优雅的捕获重复键异常的写法是直接捕获 Spring 转换后的 `DuplicateKeyException`（它是 `SQLIntegrityConstraintViolationException` 的父类或同类转换，取决于配置）：
>
> ```java
> @ExceptionHandler(DuplicateKeyException.class) // Spring 对 SQL 重复键异常的封装
>
> public Result<String> handleDuplicateKeyException(DuplicateKeyException ex) {
>
>     return Result.error("数据已存在，请勿重复添加");
>
> }
> ```
>



进入到sky-common模块，在MessageConstant.java添加

```java
public static final String ALREADY_EXISTS = "已存在";
```

再次，接口测试：

#### 1.4.2 问题二
**描述**：新增员工时，创建人id和修改人id设置为固定值

**分析：**

```java
    /**
     * 新增员工
     *
     * @param employeeDTO
     */
    public void save(EmployeeDTO employeeDTO) {
        Employee employee = new Employee();
        //................
        //////////当前设置的id为固定值10//////////
        employee.setCreateUser(10L);
        employee.setUpdateUser(10L);
        //////////////////////////////////////
        //.................................

        employeeMapper.insert(employee);//后续步骤定义
    }
```

**解决：**

通过某种方式动态获取当前登录员工的id。

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791429788974-a7dabd27-6777-4199-85e3-98eb8030aa46.png)

员工登录成功后会生成JWT令牌并响应给前端：

在sky-server模块

```java
package com.sky.controller.admin;
/**
 * 员工管理
 */
@RestController
@RequestMapping("/admin/employee")
@Slf4j
@Api(tags = "员工相关接口")
public class EmployeeController {

    @Autowired
    private EmployeeService employeeService;
    @Autowired
    private JwtProperties jwtProperties;

    /**
     * 登录
     *
     * @param employeeLoginDTO
     * @return
     */
    @PostMapping("/login")
    @ApiOperation(value = "员工登录")
    public Result<EmployeeLoginVO> login(@RequestBody EmployeeLoginDTO employeeLoginDTO) {
        //.........

        //登录成功后，生成jwt令牌
        Map<String, Object> claims = new HashMap<>();
        claims.put(JwtClaimsConstant.EMP_ID, employee.getId());
        String token = JwtUtil.createJWT(
                jwtProperties.getAdminSecretKey(),
                jwtProperties.getAdminTtl(),
                claims);

        //............

        return Result.success(employeeLoginVO);
    }

}
```

> `@Autowired` 是 Spring 框架的**依赖注入（DI）**注解。它的作用是：**告诉 Spring，请帮我从容器里找到一个合适的对象，自动赋值给我这个变量，我不需要自己手动 **`**new**`
>
> ### 为什么需要它？（传统写法 vs Spring 写法）
> **没有 Spring 的时候**，如果 Controller 要用 Service，你得自己创建：
>
> public class EmployeeController {
>
>     // 自己 new，强耦合，还要自己管理生命周期
>
>     private EmployeeService employeeService = new EmployeeServiceImpl(); 
>
> }
>
> **有了 Spring 之后**：
>
> @RestController
>
> public class EmployeeController {
>
>     @Autowired
>
>     private EmployeeService employeeService; // 不用 new，Spring 自动塞进来
>
> }
>
> Spring 在启动时，会扫描所有加了 `@Service`、`@Component`、`@Repository`、`@Controller` 的类，把它们实例化成对象（这就是 **Bean**），统一放进 **IoC 容器**里。  
当 Spring 看到 `@Autowired` 时，它就会去容器里找有没有符合 `EmployeeService` 类型的 Bean，找到后就通过**反射**，把这个对象赋值给这个字段。这就是**控制反转（IoC）**和**依赖注入（DI）**的体现。
>



后续请求中，前端会携带JWT令牌，通过JWT令牌可以解析出当前登录员工id：

JwtTokenAdminInterceptor.java

```java
package com.sky.interceptor;

/**
 * jwt令牌校验的拦截器
 */
@Component
@Slf4j
public class JwtTokenAdminInterceptor implements HandlerInterceptor {

    @Autowired
    private JwtProperties jwtProperties;

    /**
     * 校验jwt
     *
     * @param request
     * @param response
     * @param handler
     * @return
     * @throws Exception
     */
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
       
        //..............
        
        //1、从请求头中获取令牌
        String token = request.getHeader(jwtProperties.getAdminTokenName());

        //2、校验令牌
        try {
            log.info("jwt校验:{}", token);
            Claims claims = JwtUtil.parseJWT(jwtProperties.getAdminSecretKey(), token);
            Long empId = Long.valueOf(claims.get(JwtClaimsConstant.EMP_ID).toString());
            log.info("当前员工id：", empId);
            //3、通过，放行
            return true;
        } catch (Exception ex) {
            //4、不通过，响应401状态码
            response.setStatus(401);
            return false;
        }
    }
}
```

**思考：**解析出登录员工id后，如何传递给Service的save方法？

通过ThreadLocal进行传递。



#### 1.4.3 ThreadLocal
**介绍：**

ThreadLocal 并不是一个Thread，而是Thread的局部变量。  
ThreadLocal为每个线程提供单独一份存储空间，具有线程隔离的效果，只有在线程内才能获取到对应的值，线程外则不能访问。

**常用方法：**

+ public void set(T value) 	设置当前线程的线程局部变量的值
+ public T get() 		返回当前线程所对应的线程局部变量的值
+ public void remove()        移除当前线程的线程局部变量

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791430097777-ebd0ced9-4457-49d2-8b7a-92635752503b.png)



对ThreadLocal有了一定认识后，接下来继续解决**问题二**

初始工程中已经封装了 ThreadLocal 操作的工具类：

在sky-common模块

```java
package com.sky.context;

public class BaseContext {

    public static ThreadLocal<Long> threadLocal = new ThreadLocal<>();

    public static void setCurrentId(Long id) {
        threadLocal.set(id);
    }

    public static Long getCurrentId() {
        return threadLocal.get();
    }

    public static void removeCurrentId() {
        threadLocal.remove();
    }

}
```

在拦截器中解析出当前登录员工id，并放入线程局部变量中：

在sky-server模块中，拦截器：

```java
package com.sky.interceptor;

/**
 * jwt令牌校验的拦截器
 */
@Component
@Slf4j
public class JwtTokenAdminInterceptor implements HandlerInterceptor {

    @Autowired
    private JwtProperties jwtProperties;

    /**
     * 校验jwt
     *
     * @param request
     * @param response
     * @param handler
     * @return
     * @throws Exception
     */
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        
        //.............................
       
        //2、校验令牌
        try {
            //.................
            Claims claims = JwtUtil.parseJWT(jwtProperties.getAdminSecretKey(), token);
            Long empId = Long.valueOf(claims.get(JwtClaimsConstant.EMP_ID).toString());
            log.info("当前员工id：", empId);
            /////将用户id存储到ThreadLocal////////
            BaseContext.setCurrentId(empId);
            ////////////////////////////////////
            //3、通过，放行
            return true;
        } catch (Exception ex) {
            //......................
        }
    }
}
```

在Service中获取线程局部变量中的值：

```java
    /**
     * 新增员工
     *
     * @param employeeDTO
     */
    public void save(EmployeeDTO employeeDTO) {
        //.............................

        //设置当前记录创建人id和修改人id
        employee.setCreateUser(BaseContext.getCurrentId());//目前写个假数据，后期修改
        employee.setUpdateUser(BaseContext.getCurrentId());

        employeeMapper.insert(employee);
    }
```

测试：使用admin(id=1)用户登录后添加一条记录

查看employee表记录

## 2. 员工分页查询
### 2.1 需求分析和设计
#### 2.1.1 产品原型
系统中的员工很多的时候，如果在一个页面中全部展示出来会显得比较乱，不便于查看，所以一般的系统中都会以分页的方式来展示列表数据。而在我们的分页查询页面中, 除了分页条件以外，还有一个查询条件 "员工姓名"。

**查询员工原型：**

**业务规则**：

+ 根据页码展示员工信息
+ 每页展示10条数据
+ 分页查询时可以根据需要，输入员工姓名进行查询



#### 2.1.2 接口设计
找到资料-->项目接口文档-->苍穹外卖-管理端接口.html

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791430538695-54fa03e4-cf12-42d0-b32e-b1555969805e.png)<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791430549864-c92a25c4-14a2-4ed0-8bbd-fdaef691a958.png)

**注意事项：**

+ 请求参数类型为Query，不是json格式提交，在路径后直接拼接。/admin/employee/page?name=zhangsan
+ 返回数据中records数组中使用Employee实体类对属性进行封装。



### 2.2 代码开发
#### 2.2.1 设计DTO类
根据请求参数进行封装，在sky-pojo模块中

```java
package com.sky.dto;

import lombok.Data;

import java.io.Serializable;

@Data
public class EmployeePageQueryDTO implements Serializable {

    //员工姓名
    private String name;

    //页码
    private int page;

    //每页显示记录数
    private int pageSize;

}

```



#### 2.2.2 封装PageResult
后面所有的分页查询，统一都封装为PageResult对象。

在sky-common模块

```java
package com.sky.result;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

/**
 * 封装分页查询结果
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class PageResult implements Serializable {

    private long total; //总记录数

    private List records; //当前页数据集合

}

```

> ### `@Data`（全能选手）
> `@Data` 是最常用的 Lombok 注解，它相当于把下面几个注解打包在一起：
>
> + `@Getter`：生成所有字段的 get 方法。
> + `@Setter`：生成所有非 final 字段的 set 方法。
> + `@ToString`：生成 `toString()` 方法。
> + `@EqualsAndHashCode`：生成 `equals()` 和 `hashCode()` 方法。
> + `@RequiredArgsConstructor`：生成包含 `final` 和 `@NonNull` 字段的构造方法。
>
> **作用**：你不需要再手写 `getTotal()`、`setTotal()` 这些方法了，Lombok 会在编译时自动帮你加上。
>
> ### 2. `@AllArgsConstructor`（全参构造）
> **作用**：生成一个包含**所有字段**的构造方法。
>
> 对于 `PageResult`，它相当于生成了：
>
> public PageResult(long total, List records) {
>
>     this.total = total;
>
>     this.records = records;
>
> }
>
> **在苍穹外卖里的应用场景**：  
在 Service 层做分页查询后，你会经常这样写：
>
> // 如果是手动 new，代码非常简洁
>
> PageResult pageResult = new PageResult(total, records);
>
> return Result.success(pageResult);
>
> 如果没有这个注解，你就得先 `new PageResult()`，然后再 `setTotal(total)`、`setRecords(records)`，代码会啰嗦很多。
>
> ### 3. `@NoArgsConstructor`（无参构造）
> **作用**：生成一个没有参数的构造方法。
>
> public PageResult() {
>
> }
>
> **为什么加了 **`**@AllArgsConstructor**`** 还要加 **`**@NoArgsConstructor**`**？**  
这是一个非常经典的 Java 基础坑：
>
> + Java 规定，**如果一个类没有显式声明任何构造方法，编译器会默认赠送一个无参构造方法。**
> + 但是！一旦你自己写了构造方法（或者用了 `@AllArgsConstructor` 自动生成了一个有参构造），**Java 默认赠送的无参构造就会被收回。**
> + 而很多框架（比如 **Jackson 把 JSON 反序列化成对象**，或者 **MyBatis 映射查询结果**）在底层反射创建对象时，**强制要求类必须有无参构造方法**。
> + 所以，这两个注解通常**成对出现**，既方便你手动 `new` 全参对象，又保证框架能通过无参构造反射创建对象。
>



员工信息分页查询后端返回的对象类型为: Result

```java
package com.sky.result;

import lombok.Data;

import java.io.Serializable;

/**
 * 后端统一返回结果
 * @param <T>
 */
@Data
public class Result<T> implements Serializable {

    private Integer code; //编码：1成功，0和其它数字为失败
    private String msg; //错误信息
    private T data; //数据

    public static <T> Result<T> success() {
        Result<T> result = new Result<T>();
        result.code = 1;
        return result;
    }

    public static <T> Result<T> success(T object) {
        Result<T> result = new Result<T>();
        result.data = object;
        result.code = 1;
        return result;
    }

    public static <T> Result<T> error(String msg) {
        Result result = new Result();
        result.msg = msg;
        result.code = 0;
        return result;
    }

}
```



#### 2.2.3 Controller层
在sky-server模块中，com.sky.controller.admin.EmployeeController中添加分页查询方法。

```java
    /**
     * 员工分页查询
     * @param employeePageQueryDTO
     * @return
     */
    @GetMapping("/page")
    @ApiOperation("员工分页查询")
    public Result<PageResult> page(EmployeePageQueryDTO employeePageQueryDTO){
        log.info("员工分页查询，参数为：{}", employeePageQueryDTO);
        PageResult pageResult = employeeService.pageQuery(employeePageQueryDTO);//后续定义
        return Result.success(pageResult);
    }
```



#### 2.2.4 Service层接口
在EmployeeService接口中声明pageQuery方法：

```java
    /**
     * 分页查询
     * @param employeePageQueryDTO
     * @return
     */
    PageResult pageQuery(EmployeePageQueryDTO employeePageQueryDTO);
```



#### 2.2.5 Service层实现类
在EmployeeServiceImpl中实现pageQuery方法：

```java
    /**
     * 分页查询
     *
     * @param employeePageQueryDTO
     * @return
     */
    public PageResult pageQuery(EmployeePageQueryDTO employeePageQueryDTO) {
        // select * from employee limit 0,10
        //开始分页查询
        PageHelper.startPage(employeePageQueryDTO.getPage(), employeePageQueryDTO.getPageSize());

        Page<Employee> page = employeeMapper.pageQuery(employeePageQueryDTO);//后续定义

        long total = page.getTotal();
        List<Employee> records = page.getResult();

        return new PageResult(total, records);
    }
```

**注意：**此处使用 mybatis 的分页插件 PageHelper 来简化分页代码的开发。底层基于 mybatis 的拦截器实现。

故在pom.xml文中添加依赖(初始工程已添加)

```xml
<dependency>
   <groupId>com.github.pagehelper</groupId>
   <artifactId>pagehelper-spring-boot-starter</artifactId>
   <version>${pagehelper}</version>
</dependency>

```



#### 2.2.6 Mapper层
在 EmployeeMapper 中声明 pageQuery 方法：

```java
    /**
     * 分页查询
     * @param employeePageQueryDTO
     * @return
     */
    Page<Employee> pageQuery(EmployeePageQueryDTO employeePageQueryDTO);
```

在 src/main/resources/mapper/EmployeeMapper.xml 中编写SQL：

```sql
<select id="pageQuery" resultType="com.sky.entity.Employee">
        select * from employee
        <where>
            <if test="name != null and name != ''">
                and name like concat('%',#{name},'%')
            </if>
        </where>
        order by create_time desc
    </select>

```

### 2.3 功能测试
可以通过接口文档进行测试，也可以进行前后端联调测试。

接下来使用两种方式分别测试：



#### 2.3.1 接口文档测试
**重启服务：**访问[http://localhost:8080/doc.html，进入员工分页查询](http://localhost:8080/doc.html，进入员工分页查询)

**响应结果：**

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791431022389-c559edd4-4740-4a86-9028-c78713b5f1b7.png)

#### 2.3.2 前后端联调测试
**点击员工管理**

**输入员工姓名为zhangsan**

不难发现，**最后操作时间格式**不清晰，在**代码完善**中解决。（原有讲义截图）

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791431077622-bd2f3ab4-c344-42ff-b4ba-26d13565b578.png)

### 2.4 代码完善
**问题描述：**操作时间字段显示有问题。

**解决方式：**

**1).  方式一**

在属性上加上注解，对日期进行格式化

但这种方式，需要在每个时间属性上都要加上该注解，使用较麻烦，不能全局处理。

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791431108154-7f8ff784-5bee-4342-bf67-45a0528f1757.png)

**2).  方式二（推荐 )**

在WebMvcConfiguration中扩展SpringMVC的消息转换器，统一对日期类型进行格式处理

```java
    /**
     * 扩展Spring MVC框架的消息转化器
     * @param converters
     */
    protected void extendMessageConverters(List<HttpMessageConverter<?>> converters) {
        log.info("扩展消息转换器...");
        //创建一个消息转换器对象
        MappingJackson2HttpMessageConverter converter = new MappingJackson2HttpMessageConverter();
        //需要为消息转换器设置一个对象转换器，对象转换器可以将Java对象序列化为json数据
        converter.setObjectMapper(new JacksonObjectMapper());
        //将自己的消息转化器加入容器中
        converters.add(0,converter);
    }
```

添加后，再次测试

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791431175748-f2d9c629-5d98-4d83-b287-4111c242f4a3.png)

时间格式定义，sky-common模块中

```java
package com.sky.json;

public class JacksonObjectMapper extends ObjectMapper {

    //.......
    public static final String DEFAULT_DATE_TIME_FORMAT = "yyyy-MM-dd HH:mm";
    //.......

    }
}
```

## 3. 启用禁用员工账号
### 3.1 需求分析与设计
#### 3.1.1 产品原型
在员工管理列表页面，可以对某个员工账号进行启用或者禁用操作。账号禁用的员工不能登录系统，启用后的员工可以正常登录。如果某个员工账号状态为正常，则按钮显示为 "禁用"，如果员工账号状态为已禁用，则按钮显示为"启用"。

**业务规则：**

+ 可以对状态为“启用” 的员工账号进行“禁用”操作
+ 可以对状态为“禁用”的员工账号进行“启用”操作
+ 状态为“禁用”的员工账号不能登录系统

#### 3.1.2 接口设计
<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791431326266-ddf1b4e4-7ae3-4a6c-9447-26645a9f733f.png)<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791431334158-1e6b9d4c-5bc1-43e4-8610-724f36837baa.png)

1). 路径参数携带状态值。

2). 同时，把id传递过去，明确对哪个用户进行操作。

3). 返回数据code状态是必须，其它是非必须。

### 3.2 代码开发
#### 3.2.1 Controller层
在sky-server模块中，根据接口设计中的请求参数形式对应的在 EmployeeController 中创建启用禁用员工账号的方法：

```java
/**
     * 启用禁用员工账号
     * @param status
     * @param id
     * @return
     */
    @PostMapping("/status/{status}")
    @ApiOperation("启用禁用员工账号")
    public Result startOrStop(@PathVariable Integer status,Long id){
        log.info("启用禁用员工账号：{},{}",status,id);
        employeeService.startOrStop(status,id);//后绪步骤定义
        return Result.success();
    }
```

> `@PathVariable` 是 Spring MVC 提供的注解，它的作用是**将 URL 路径中的占位符（**`**{status}**`**），绑定到 Controller 方法的参数上**。
>
> 结合你贴的这段苍穹外卖代码，我帮你把它拆解清楚：
>
> ### 1. 核心工作原理（URL 与参数的映射）
> 你的代码中，映射路径是 `@PostMapping("/status/{status}")`。注意 `{status}` 是一个**路径占位符**。
>
> 当前端发起请求时，实际的 URL 大致长这样：  
`http://localhost:8080/employee/status/1?id=100`
>
> + 路径中的 `{status}` 位置被 `1` 替换了。
> + `@PathVariable Integer status` 的作用，就是把 URL 里这个 `1` 截取出来，赋值给方法的 `status` 参数。
>

#### 3.2.2 Service层接口
在 EmployeeService 接口中声明启用禁用员工账号的业务方法：

```java
/**
     * 启用禁用员工账号
     * @param status
     * @param id
     */
    void startOrStop(Integer status, Long id);
```

#### 3.2.3 Service层实现类
在 EmployeeServiceImpl 中实现启用禁用员工账号的业务方法：

```java
/**
     * 启用禁用员工账号
     *
     * @param status
     * @param id
     */
    public void startOrStop(Integer status, Long id) {
        Employee employee = Employee.builder()
                .status(status)
                .id(id)
                .build();

        employeeMapper.update(employee);
    }
```

> `.builder()` 是 **建造者模式（Builder Pattern）** 的体现，在苍穹外卖中，它是由 **Lombok 的 **`**@Builder**`** 注解**自动生成的。
>
> **传统写法（繁琐）：**
>
> 
>

```plain
Employee employee = new Employee();
employee.setStatus(status);
employee.setId(id);
```

或者用全参构造器（参数顺序容易搞错）：

```plain
// 如果 Employee 有10个字段，这种写法简直灾难
Employee employee = new Employee(id, null, null, null, status, ...);
```

**Builder 写法（优雅）：**

```plain
Employee employee = Employee.builder()
        .status(status)
        .id(id)
        .build();
```

#### 3.2.4 Mapper层
在 EmployeeMapper 接口中声明 update 方法：

```java
/**
     * 根据主键动态修改属性
     * @param employee
     */
    void update(Employee employee);
```

在 EmployeeMapper.xml 中编写SQL：

```sql
<update id="update" parameterType="Employee">
        update employee
        <set>
            <if test="name != null">name = #{name},</if>
            <if test="username != null">username = #{username},</if>
            <if test="password != null">password = #{password},</if>
            <if test="phone != null">phone = #{phone},</if>
            <if test="sex != null">sex = #{sex},</if>
            <if test="idNumber != null">id_Number = #{idNumber},</if>
            <if test="updateTime != null">update_Time = #{updateTime},</if>
            <if test="updateUser != null">update_User = #{updateUser},</if>
            <if test="status != null">status = #{status},</if>
        </set>
        where id = #{id}
    </update>
```

> 这是 **MyBatis 的动态 SQL 更新**（常被称为“选择性更新”或“按需更新”）。它的核心逻辑是：**根据你传入的 **`**Employee**`** 对象，哪个字段有值就更新哪个字段，没值的字段保持数据库原样，绝不覆盖。**
>

### 3.3 功能测试 （差不多流程）
#### 3.3.1 接口文档测试
**测试前，**查询employee表中员工账号状态

**开始测试**

**测试完毕后**，再次查询员工账号状态

#### 3.3.2 前后端联调测试
**测试前：**

**点击启用:**



## 4. 编辑员工
### 4.1 需求分析与设计
#### 4.1.1 产品原型
在员工管理列表页面点击 "编辑" 按钮，跳转到编辑页面，在编辑页面回显员工信息并进行修改，最后点击 "保存" 按钮完成编辑操作。

**员工列表原型：**

**修改页面原型**：

注：点击修改时，数据应该正常回显到修改页面。

#### 4.1.2 接口设计
根据上述原型图分析，编辑员工功能涉及到两个接口：

+ 根据id查询员工信息
+ 编辑员工信息

**1). 根据id查询员工信息**

 <!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791431744055-46f920a4-2b89-4149-a460-6d90700fbf4a.png)<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791431753299-e408aa22-1fd6-4201-be3b-f2ee09106103.png)



**2). 编辑员工信息**

 <!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791431721988-1246a525-e7b1-4e85-bc7b-21004bbb6fd5.png)<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791431733472-c0c70148-7617-4793-b20a-61e51510e966.png)

**注:因为是修改功能，请求方式可设置为PUT。**



| 请求方式 | 语义 | 对应操作 | 典型场景 | 幂等性 |
| --- | --- | --- | --- | --- |
| **GET** | 获取资源 | 查（Read） | 查询员工列表、查询菜品详情 | 是 |
| **POST** | 创建资源 | 增（Create） | 新增员工、新增菜品、登录 | 否 |
| **PUT** | 更新资源 | 改（Update） | 修改员工信息、启用禁用账号 | 是 |
| **DELETE** | 删除资源 | 删（Delete） | 删除菜品、删除员工 | 是 |


幂等性（Idempotency）

+ **POST**：**非幂等**。连续调用两次，会在数据库里新增两条记录（比如提交两次订单，会生成两个订单）。
+ **PUT**：**幂等**。连续调用两次，结果和调用一次是一样的（比如把员工状态改成 1，调 100 次，最终状态还是 1）。



### 4.2 代码开发
#### 4.2.1 回显员工信息功能
**1). Controller层**

在 EmployeeController 中创建 getById 方法：

```java
    /**
     * 根据id查询员工信息
     * @param id
     * @return
     */
    @GetMapping("/{id}")
    @ApiOperation("根据id查询员工信息")
    public Result<Employee> getById(@PathVariable Long id){
        Employee employee = employeeService.getById(id);
        return Result.success(employee);
    }
```



**2). Service层接口**

在 EmployeeService 接口中声明 getById 方法：

```java
    /**
     * 根据id查询员工
     * @param id
     * @return
     */
    Employee getById(Long id);
```



**3). Service层实现类**

在 EmployeeServiceImpl 中实现 getById 方法：

```java
     /**
     * 根据id查询员工
     *
     * @param id
     * @return
     */
    public Employee getById(Long id) {
        Employee employee = employeeMapper.getById(id);
        employee.setPassword("****");
        return employee;
    }
```



**4). Mapper层**

在 EmployeeMapper 接口中声明 getById 方法：

```java
    /**
     * 根据id查询员工信息
     * @param id
     * @return
     */
    @Select("select * from employee where id = #{id}")
    Employee getById(Long id);
```



#### 4.2.2 修改员工信息功能
**1). Controller层**

在 EmployeeController 中创建 update 方法：

```java
    /**
     * 编辑员工信息
     * @param employeeDTO
     * @return
     */
    @PutMapping
    @ApiOperation("编辑员工信息")
    public Result update(@RequestBody EmployeeDTO employeeDTO){
        log.info("编辑员工信息：{}", employeeDTO);
        employeeService.update(employeeDTO);
        return Result.success();
    }
```



**2). Service层接口**

在 EmployeeService 接口中声明 update 方法：

```java
    /**
     * 编辑员工信息
     * @param employeeDTO
     */
    void update(EmployeeDTO employeeDTO);
```



**3). Service层实现类**

在 EmployeeServiceImpl 中实现 update 方法：

```java
     /**
     * 编辑员工信息
     *
     * @param employeeDTO
     */
    public void update(EmployeeDTO employeeDTO) {
        Employee employee = new Employee();
        BeanUtils.copyProperties(employeeDTO, employee);

        employee.setUpdateTime(LocalDateTime.now());
        employee.setUpdateUser(BaseContext.getCurrentId());

        employeeMapper.update(employee);
    }
```

在实现**启用禁用员工账号**功能时，已实现employeeMapper.update(employee)，在此不需写Mapper层代码。



### 4.3 功能测试 （懒得测）
#### 4.3.1 接口文档测试
分别测试**根据id查询员工信息**和**编辑员工信息**两个接口

**1). 根据id查询员工信息**

查询employee表中的数据，以id=4的记录为例

<!-- 这是一张图片，ocr 内容为： -->


> 图片暂缺：按 id 查询员工信息的接口测试截图。原笔记引用的本地图片未随文提供。



开始测试

获取到了id=4的相关员工信息

**2). 编辑员工信息**

修改id=4的员工信息，**name**由**zhangsan**改为**张三丰**，**username**由**张三**改为**zhangsanfeng**。

查看employee表数据





#### 4.3.2 前后端联调测试
进入到员工列表查询

对员工姓名为杰克的员工数据修改，点击修改，数据已回显

修改后，点击保存



## 5. 导入分类模块功能代码
### 5.1 需求分析与设计
#### 5.1.1 产品原型
后台系统中可以管理分类信息，分类包括两种类型，分别是 **菜品分类** 和 **套餐分类** 。

先来分析**菜品分类**相关功能。

**新增菜品分类：**当我们在后台系统中添加菜品时需要选择一个菜品分类，在移动端也会按照菜品分类来展示对应的菜品。

**菜品分类分页查询：**系统中的分类很多的时候，如果在一个页面中全部展示出来会显得比较乱，不便于查看，所以一般的系统中都会以分页的方式来展示列表数据。

**根据id删除菜品分类：**在分类管理列表页面，可以对某个分类进行删除操作。需要注意的是当分类关联了菜品或者套餐时，此分类不允许删除。

**修改菜品分类：**在分类管理列表页面点击修改按钮，弹出修改窗口，在修改窗口回显分类信息并进行修改，最后点击确定按钮完成修改操作。

**启用禁用菜品分类：**在分类管理列表页面，可以对某个分类进行启用或者禁用操作。

**分类类型查询：**当点击分类类型下拉框时，从数据库中查询所有的菜品分类数据进行展示。

**分类管理原型：**<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791440149553-91627341-ca3b-4d54-811e-d7095589d2d8.png)

**业务规则：**

+ 分类名称必须是唯一的
+ 分类按照类型可以分为菜品分类和套餐分类
+ 新添加的分类状态默认为“禁用”



#### 5.1.2 接口设计
根据上述原型图分析，菜品分类模块共涉及6个接口。

+ 新增分类
+ 分类分页查询
+ 根据id删除分类
+ 修改分类
+ 启用禁用分类
+ 根据类型查询分类

接下来，详细地分析每个接口。

找到资料-->项目接口文档-->苍穹外卖-管理端接口.html

**1). 新增分类**

 <!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791440185321-7c42b0f5-e47a-4086-be78-557238183d02.png)<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791440191482-30ad11e2-2951-4b5f-b5b6-8dc119ef0e64.png)

**2). 分类分页查询**

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791440201337-9a3c1a6c-5ed4-4f02-89ba-519b78fd3fad.png)<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791440208175-79ce35fd-cb4f-4dcf-9171-dc7c4b8cd108.png)

**3). 根据id删除分类**

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791440217541-11943e84-97fb-43d6-a43c-c3321f18d521.png)	

**4). 修改分类**

 <!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791440224309-090291ae-d82c-41cf-9a62-c68ef667f85a.png)<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791440228908-f5bc7120-9469-47a1-9f5c-2a680b330bb2.png)

**5). 启用禁用分类**

 <!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791440238218-4f22f8bd-9343-4204-b7d1-64dff912e540.png)<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791440243390-fde25c6d-b3e8-491c-bb0b-20dd261334e6.png)

**6). 根据类型查询分类**

 <!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791440250054-493de9e2-8c08-4dee-a32f-fa1d692278e4.png)	<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791440257592-5608e462-5ce9-470e-ac41-f5c95d803f0b.png)

#### 5.1.3 表设计
**category表结构：**

| **字段名** | **数据类型** | **说明** | **备注** |
| --- | --- | --- | --- |
| id | bigint | 主键 | 自增 |
| name | varchar(32) | 分类名称 | 唯一 |
| type | int | 分类类型 | 1菜品分类 2套餐分类 |
| sort | int | 排序字段 | 用于分类数据的排序 |
| status | int | 状态 | 1启用 0禁用 |
| create_time | datetime | 创建时间 |  |
| update_time | datetime | 最后修改时间 |  |
| create_user | bigint | 创建人id |  |
| update_user | bigint | 最后修改人id |  |


### 5.2 代码导入
导入资料中的分类管理模块功能代码即可

可按照mapper-->service-->controller依次导入，这样代码不会显示相应的报错。

进入到sky-server模块中

#### 5.2.1 Mapper层
**DishMapper.java**

```java
package com.sky.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface DishMapper {

    /**
     * 根据分类id查询菜品数量
     * @param categoryId
     * @return
     */
    @Select("select count(id) from dish where category_id = #{categoryId}")
    Integer countByCategoryId(Long categoryId);

}

```

**SetmealMapper.java**

```java
package com.sky.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface SetmealMapper {

    /**
     * 根据分类id查询套餐的数量
     * @param id
     * @return
     */
    @Select("select count(id) from setmeal where category_id = #{categoryId}")
    Integer countByCategoryId(Long id);

}
```

**CategoryMapper.java**

```java
package com.sky.mapper;

import com.github.pagehelper.Page;
import com.sky.dto.CategoryPageQueryDTO;
import com.sky.entity.Category;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface CategoryMapper {

    /**
     * 插入数据
     * @param category
     */
    @Insert("insert into category(type, name, sort, status, create_time, update_time, create_user, update_user)" +
            " VALUES" +
            " (#{type}, #{name}, #{sort}, #{status}, #{createTime}, #{updateTime}, #{createUser}, #{updateUser})")
    void insert(Category category);

    /**
     * 分页查询
     * @param categoryPageQueryDTO
     * @return
     */
    Page<Category> pageQuery(CategoryPageQueryDTO categoryPageQueryDTO);

    /**
     * 根据id删除分类
     * @param id
     */
    @Delete("delete from category where id = #{id}")
    void deleteById(Long id);

    /**
     * 根据id修改分类
     * @param category
     */
    void update(Category category);

    /**
     * 根据类型查询分类
     * @param type
     * @return
     */
    List<Category> list(Integer type);
}
```

**CategoryMapper.xml**,进入到resources/mapper目录下

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd" >
<mapper namespace="com.sky.mapper.CategoryMapper">

    <select id="pageQuery" resultType="com.sky.entity.Category">
        select * from category
        <where>
            <if test="name != null and name != ''">
                and name like concat('%',#{name},'%')
            </if>
            <if test="type != null">
                and type = #{type}
            </if>
        </where>
        order by sort asc , create_time desc
    </select>
    <update id="update" parameterType="Category">
        update category
        <set>
            <if test="type != null">
                type = #{type},
            </if>
            <if test="name != null">
                name = #{name},
            </if>
            <if test="sort != null">
                sort = #{sort},
            </if>
            <if test="status != null">
                status = #{status},
            </if>
            <if test="updateTime != null">
                update_time = #{updateTime},
            </if>
            <if test="updateUser != null">
                update_user = #{updateUser}
            </if>
        </set>
        where id = #{id}
    </update>
    <select id="list" resultType="Category">
        select * from category
        where status = 1
        <if test="type != null">
            and type = #{type}
        </if>
        order by sort asc,create_time desc
    </select>
</mapper>

```



#### 5.2.2 Service层
**CategoryService.java**

```java
package com.sky.service;

import com.sky.dto.CategoryDTO;
import com.sky.dto.CategoryPageQueryDTO;
import com.sky.entity.Category;
import com.sky.result.PageResult;
import java.util.List;

public interface CategoryService {

    /**
     * 新增分类
     * @param categoryDTO
     */
    void save(CategoryDTO categoryDTO);

    /**
     * 分页查询
     * @param categoryPageQueryDTO
     * @return
     */
    PageResult pageQuery(CategoryPageQueryDTO categoryPageQueryDTO);

    /**
     * 根据id删除分类
     * @param id
     */
    void deleteById(Long id);

    /**
     * 修改分类
     * @param categoryDTO
     */
    void update(CategoryDTO categoryDTO);

    /**
     * 启用、禁用分类
     * @param status
     * @param id
     */
    void startOrStop(Integer status, Long id);

    /**
     * 根据类型查询分类
     * @param type
     * @return
     */
    List<Category> list(Integer type);
}

```

**EmployeeServiceImpl.java**

```java
package com.sky.service.impl;

import com.github.pagehelper.Page;
import com.github.pagehelper.PageHelper;
import com.sky.constant.MessageConstant;
import com.sky.constant.PasswordConstant;
import com.sky.constant.StatusConstant;
import com.sky.context.BaseContext;
import com.sky.dto.EmployeeDTO;
import com.sky.dto.EmployeeLoginDTO;
import com.sky.dto.EmployeePageQueryDTO;
import com.sky.entity.Employee;
import com.sky.exception.AccountLockedException;
import com.sky.exception.AccountNotFoundException;
import com.sky.exception.PasswordErrorException;
import com.sky.mapper.EmployeeMapper;
import com.sky.result.PageResult;
import com.sky.service.EmployeeService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.DigestUtils;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class EmployeeServiceImpl implements EmployeeService {

    @Autowired
    private EmployeeMapper employeeMapper;

    /**
     * 员工登录
     *
     * @param employeeLoginDTO
     * @return
     */
    public Employee login(EmployeeLoginDTO employeeLoginDTO) {
        String username = employeeLoginDTO.getUsername();
        String password = employeeLoginDTO.getPassword();

        //1、根据用户名查询数据库中的数据
        Employee employee = employeeMapper.getByUsername(username);

        //2、处理各种异常情况（用户名不存在、密码不对、账号被锁定）
        if (employee == null) {
            //账号不存在
            throw new AccountNotFoundException(MessageConstant.ACCOUNT_NOT_FOUND);
        }

        //密码比对
        // TODO 后期需要进行md5加密，然后再进行比对
        password = DigestUtils.md5DigestAsHex(password.getBytes());
        if (!password.equals(employee.getPassword())) {
            //密码错误
            throw new PasswordErrorException(MessageConstant.PASSWORD_ERROR);
        }

        if (employee.getStatus() == StatusConstant.DISABLE) {
            //账号被锁定
            throw new AccountLockedException(MessageConstant.ACCOUNT_LOCKED);
        }

        //3、返回实体对象
        return employee;
    }

    /**
     * 新增员工
     *
     * @param employeeDTO
     */
    public void save(EmployeeDTO employeeDTO) {
        Employee employee = new Employee();

        //对象属性拷贝
        BeanUtils.copyProperties(employeeDTO, employee);

        //设置账号的状态，默认正常状态 1表示正常 0表示锁定
        employee.setStatus(StatusConstant.ENABLE);

        //设置密码，默认密码123456
        employee.setPassword(DigestUtils.md5DigestAsHex(PasswordConstant.DEFAULT_PASSWORD.getBytes()));

        //设置当前记录的创建时间和修改时间
        employee.setCreateTime(LocalDateTime.now());
        employee.setUpdateTime(LocalDateTime.now());

        //设置当前记录创建人id和修改人id
        employee.setCreateUser(BaseContext.getCurrentId());//目前写个假数据，后期修改
        employee.setUpdateUser(BaseContext.getCurrentId());

        employeeMapper.insert(employee);
    }

    /**
     * 分页查询
     *
     * @param employeePageQueryDTO
     * @return
     */
    public PageResult pageQuery(EmployeePageQueryDTO employeePageQueryDTO) {
        // select * from employee limit 0,10
        //开始分页查询
        PageHelper.startPage(employeePageQueryDTO.getPage(), employeePageQueryDTO.getPageSize());

        Page<Employee> page = employeeMapper.pageQuery(employeePageQueryDTO);

        long total = page.getTotal();
        List<Employee> records = page.getResult();

        return new PageResult(total, records);
    }

    /**
     * 启用禁用员工账号
     *
     * @param status
     * @param id
     */
    public void startOrStop(Integer status, Long id) {
        Employee employee = Employee.builder()
                .status(status)
                .id(id)
                .build();

        employeeMapper.update(employee);
    }

    /**
     * 根据id查询员工
     *
     * @param id
     * @return
     */
    public Employee getById(Long id) {
        Employee employee = employeeMapper.getById(id);
        employee.setPassword("****");
        return employee;
    }

    /**
     * 编辑员工信息
     *
     * @param employeeDTO
     */
    public void update(EmployeeDTO employeeDTO) {
        Employee employee = new Employee();
        BeanUtils.copyProperties(employeeDTO, employee);

        employee.setUpdateTime(LocalDateTime.now());
        employee.setUpdateUser(BaseContext.getCurrentId());

        employeeMapper.update(employee);
    }

}
```



#### 5.2.3 Controller层
**CategoryController.java**

```java
package com.sky.controller.admin;

import com.sky.dto.CategoryDTO;
import com.sky.dto.CategoryPageQueryDTO;
import com.sky.entity.Category;
import com.sky.result.PageResult;
import com.sky.result.Result;
import com.sky.service.CategoryService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * 分类管理
 */
@RestController
@RequestMapping("/admin/category")
@Api(tags = "分类相关接口")
@Slf4j
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    /**
     * 新增分类
     * @param categoryDTO
     * @return
     */
    @PostMapping
    @ApiOperation("新增分类")
    public Result<String> save(@RequestBody CategoryDTO categoryDTO){
        log.info("新增分类：{}", categoryDTO);
        categoryService.save(categoryDTO);
        return Result.success();
    }

    /**
     * 分类分页查询
     * @param categoryPageQueryDTO
     * @return
     */
    @GetMapping("/page")
    @ApiOperation("分类分页查询")
    public Result<PageResult> page(CategoryPageQueryDTO categoryPageQueryDTO){
        log.info("分页查询：{}", categoryPageQueryDTO);
        PageResult pageResult = categoryService.pageQuery(categoryPageQueryDTO);
        return Result.success(pageResult);
    }

    /**
     * 删除分类
     * @param id
     * @return
     */
    @DeleteMapping
    @ApiOperation("删除分类")
    public Result<String> deleteById(Long id){
        log.info("删除分类：{}", id);
        categoryService.deleteById(id);
        return Result.success();
    }

    /**
     * 修改分类
     * @param categoryDTO
     * @return
     */
    @PutMapping
    @ApiOperation("修改分类")
    public Result<String> update(@RequestBody CategoryDTO categoryDTO){
        categoryService.update(categoryDTO);
        return Result.success();
    }

    /**
     * 启用、禁用分类
     * @param status
     * @param id
     * @return
     */
    @PostMapping("/status/{status}")
    @ApiOperation("启用禁用分类")
    public Result<String> startOrStop(@PathVariable("status") Integer status, Long id){
        categoryService.startOrStop(status,id);
        return Result.success();
    }

    /**
     * 根据类型查询分类
     * @param type
     * @return
     */
    @GetMapping("/list")
    @ApiOperation("根据类型查询分类")
    public Result<List<Category>> list(Integer type){
        List<Category> list = categoryService.list(type);
        return Result.success(list);
    }
}
```

全部导入完毕后，进行编译

### 5.3 功能测试 （基本与上面差不多）
重启服务，访问[http://localhost:80,进入分类管理](http://localhost:80,进入分类管理)

**分页查询：**

**分类类型：**

**启用禁用：**

点击禁用

**修改：**

回显

修改后

**新增：**

点击确定，查询列表

**删除：**

删除后，查询分类列表

删除成功



