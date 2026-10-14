---
title: "苍穹外卖 Day 01：环境搭建与登录"
description: "认识项目技术栈，搭建前后端与数据库环境，理解 Nginx 反向代理、登录流程和 Swagger 接口文档。"
category: "web"
tags: ["Spring Boot","Nginx","Swagger","苍穹外卖"]
cover: "sky"
importedAt: "2026-10-14"
series: "sky-takeout"
seriesOrder: 1
sourceLabel: "黑马程序员《苍穹外卖》课程学习笔记，含个人批注与调试记录"
---

# DAY 01
## 1.技术选型
**1). 用户层**

本项目中在构建系统管理后台的前端页面，我们会用到H5、Vue.js、ElementUI、apache echarts(展示图表)等技术。而在构建移动端应用时，我们会使用到微信小程序。

**2). 网关层**

Nginx是一个服务器，主要用来作为Http服务器，部署静态资源，访问性能高。在Nginx中还有两个比较重要的作用： 反向代理和负载均衡， 在进行项目部署时，要实现Tomcat的负载均衡，就可以通过Nginx来实现。

**3). 应用层**

SpringBoot： 快速构建Spring项目, 采用 "约定优于配置" 的思想, 简化Spring项目的配置开发。

SpringMVC：SpringMVC是spring框架的一个模块，springmvc和spring无需通过中间整合层进行整合，可以无缝集成。

Spring Task: 由Spring提供的**定时任务框架**。

httpclient: 主要实现了对http请求的发送。

Spring Cache: 由**Spring提供的数据缓存框架**

JWT: 用于对应用程序上的用户进行身份验证的标记。

阿里云OSS: 对象存储服务，在项目中主要存储文件，如图片等。

Swagger： 可以自动的帮助开发人员生成接口文档，并对接口进行测试。

POI: 封装了对Excel表格的常用操作。

WebSocket: 一种通信网络协议，使客户端和服务器之间的数据交换更加简单，用于项目的来单、催单功能实现。

**4). 数据层**

MySQL： 关系型数据库, 本项目的核心业务数据都会采用MySQL进行存储。

Redis： 基于key-value格式存储的内存数据库, 访问速度快, 经常使用它做缓存。

Mybatis： 本项目持久层将会使用Mybatis开发。

pagehelper: 分页插件。

spring data redis: 简化java代码操作Redis的API。

**5). 工具**

git: 版本控制工具, 在团队协作中, 使用该工具对项目中的代码进行管理。

maven: 项目构建工具。

junit：单元测试工具，开发人员功能实现完毕后，需要通过junit对功能进行单元测试。

postman: 接口测工具，模拟用户发起的各类HTTP请求，获取对应的响应结果。



## 2.开发环境搭建
### 2.1前端环境搭建
从资料中找到前端运行环境的nginx，移动到**非中文目录**下。



遇到的报错，双击 nginx.exe 没反应

看到error.log里面有错误日志 ：

2026/10/06 12:01:06 [emerg] 5428#21892: CreateDirectory() "E:\onlylo_codes\nginx-1.20.2/temp/client_body_temp" failed (3: The system cannot find the path specified)



手动创建 temp/client_body_temp 目录解决



启动后输入 http://localhost:80 看到



<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791271235110-25aa69a0-9543-4bc1-987c-edcb1ebd5abf.png)



### 2.2 后端环境搭建
####  熟悉项目结构
后端工程基于 maven 进行项目构建，并且进行分模块开发。

**1). 从当天资料中找到后端初始工程：**

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791271437942-c84ccbd2-d16f-46d9-a9e1-7ae31a926828.png)

**2). 用 IDEA 打开初始工程，了解项目的整体结构：**

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791271524203-06b01383-5ffc-453e-b5f9-5485bb0e90dc.png)

****

对工程的每个模块作用说明：

| **序号** | **名称** | **说明** |
| --- | --- | --- |
| 1 | sky-take-out | maven父工程，统一管理依赖版本，聚合其他子模块 |
| 2 | sky-common | 子模块，存放公共类，例如：工具类、常量类、异常类等 |
| 3 | sky-pojo | 子模块，存放实体类、VO、DTO等 |
| 4 | sky-server | 子模块，后端服务，存放配置文件、Controller、Service、Mapper等 |




详细分析上述的每个子模块：

+ **sky-common:** 模块中存放的是一些公共类，可以供其他模块使用

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791271563669-78d0eb90-1c35-4682-8284-1b48b2884e53.png)

| 名称 | 说明 |
| --- | --- |
| constant | 存放相关常量类 |
| context | 存放上下文类 |
| enumeration | 项目的枚举类存储 |
| exception | 存放自定义异常类 |
| json | 处理json转换的类 |
| properties | 存放SpringBoot相关的配置属性类 |
| result | 返回结果类的封装 |
| utils | 常用工具类 |




+ **sky-pojo:** 模块中存放的是一些 entity、DTO、VO

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791271709859-1014318c-8e78-4ec1-bc4f-6c2c920edef2.png)



分析sky-pojo模块的每个包的作用：

| **名称** | **说明** | **数据流向** |
| --- | --- | --- |
| Entity | 实体，通常和数据库中的表对应 | Mapper/DB ↔ Service |
| DTO | 数据传输对象，通常用于程序中各层之间传递数据 | 前端 → Controller → Service |
| VO | 视图对象，为前端展示数据提供的对象 | Service → Controller → 前端 |
| POJO | 普通Java对象，只有属性和对应的getter和setter |  |


+ **sky-server:** 模块中存放的是 配置文件、配置类、拦截器、controller、service、mapper、启动类等分析sky-server模块的每个包的作用：

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791272073905-2c869e78-ea56-42b0-bfb2-864203eb9958.png)

| 名称 | 说明 |
| --- | --- |
| config | 存放配置类 |
| controller | 存放controller类 |
| interceptor | 存放拦截器类 |
| mapper | 存放mapper接口 |
| service | 存放service类 |
| SkyApplication | 启动类 |




#### 数据库环境搭建
1. **从资料中找到sky.sql**

直接打开sky.sql文件

<!-- 这是一张图片，ocr 内容为： -->


> 图片暂缺：sky.sql 数据库导入界面。原笔记引用的本地图片未随文提供。

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791272274986-5d46c516-4258-430e-b3fd-1d14e130713a.png)

通过该sql文件直接可创建数据库，所以不需要提前创建数据库，直接导入该文件执行即可。

双击打开截图如下：

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791272349320-f7e4c3c8-fe8b-455a-b81e-0650651ff1f5.png)

2. **执行sky.sql文件**

这里我用的是 Navicat

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791272413984-da418a4d-45f4-4f5d-9eba-20f774e10d88.png)	

执行完成后，共创建出11张表（记得navicat 刷新一下）

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791272563051-8a828eef-3fc1-4f47-ad15-0ec39c928df2.png)

每张表的说明：

| **序号** | **表名** | **中文名** |
| --- | --- | --- |
| 1 | employee | 员工表 |
| 2 | category | 分类表 |
| 3 | dish | 菜品表 |
| 4 | dish_flavor | 菜品口味表 |
| 5 | setmeal | 套餐表 |
| 6 | setmeal_dish | 套餐菜品关系表 |
| 7 | user | 用户表 |
| 8 | address_book | 地址表 |
| 9 | shopping_cart | 购物车表 |
| 10 | orders | 订单表 |
| 11 | order_detail | 订单明细表 |


对于具体的表结构, 以及表结构中的字段, 可以参考资料中的**《数据库设计文档》**，

部分截图如下：

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791272639664-232ab0fe-ab3a-4c92-b181-a9b268420316.png)

#### 前后端联调
后端的初始工程中已经实现了**登录**功能，直接进行前后端联调测试即可

我点击登录后没反应，F12查看网络

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791273136333-2ef888e8-8038-4608-8afc-49d461d681ec.png)

想起来后端都没启动hhh

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791273314101-1f79413a-efe3-4352-8d65-b51e6fe0c532.png)

启动后再次点击登录

还是没反应，后端日志：

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791273389032-5c0a42b5-1760-47aa-88e4-a6f3b3639797.png)

发现后端收到了登录请求，但是连接数据库报错了，找了下发现是配置没修改，修改下host改为本地，password改为自己数据库的

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791273622761-44ad8c0b-bca0-422c-88e6-346ee0bbbfea.png)

再一次启动，密码错误。。。

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791273498903-79392293-060e-4d1a-904b-b3d9ed88325f.png)

还挺奇怪的，数据库里面 和 负载是一样的，

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791273839435-065287bd-cf90-44bd-97ff-c4e1b70412f1.png)

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791273853335-e132b39d-2734-4511-b8ba-a52d509978ea.png)

看了下登录ServiceImpl

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791274094225-ba36fa60-35bb-4530-b954-86c65be17b7d.png)

原来要md5加密。。。

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791274186095-85a3a139-2aab-4015-bd08-57b0b9434b22.png)

去网上找了个md5加密，修改了下数据库，终于登录成功、

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791274225356-07511cd0-bfd9-436b-a612-317691ac9707.png)

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791274320645-36567dfa-cc40-4ec7-9a80-1c576c31de4c.png)

实现思路：

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791273026935-d8f4613f-f82c-4972-be22-cca9edeed676.png)

**1.Controller层**

在sky-server模块中，com.sky.controller.admin.EmployeeController

```java
/**
     * 登录
     *
     * @param employeeLoginDTO
     * @return
     */
    @PostMapping("/login")
    public Result<EmployeeLoginVO> login(@RequestBody EmployeeLoginDTO employeeLoginDTO) {
        // DTO 前端传给后端的对象
        log.info("员工登录：{}", employeeLoginDTO);
        //调用service方法查询数据库
        Employee employee = employeeService.login(employeeLoginDTO);

        //登录成功后，生成jwt令牌
        Map<String, Object> claims = new HashMap<>();
        claims.put(JwtClaimsConstant.EMP_ID, employee.getId());
        String token = JwtUtil.createJWT(
                jwtProperties.getAdminSecretKey(),
                jwtProperties.getAdminTtl(),
                claims);
        // VO 给前端展示的数据
        EmployeeLoginVO employeeLoginVO = EmployeeLoginVO.builder()
                .id(employee.getId())
                .userName(employee.getUsername())
                .name(employee.getName())
                .token(token)
                .build();

        return Result.success(employeeLoginVO);
    }
```

**2.Service层**

在sky-server模块中，com.sky.service.impl.EmployeeServiceImpl

```java
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
```

**3.Mapper层**

在sky-server模块中，com.sky.mapper.EmployeeMapper

```java
package com.sky.mapper;

import com.sky.entity.Employee;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface EmployeeMapper {

    /**
     * 根据用户名查询员工
     * @param username
     * @return
     */
    @Select("select * from employee where username = #{username}")
    Employee getByUsername(String username);

}

```

#### nginx反向代理和负载均衡
对登录功能测试完毕后，接下来，我们思考一个问题：**前端发送的请求，是如何请求到后端服务的？**

前端请求地址：[http://localhost/api/employee/login](http://localhost/api/employee/login)

后端接口地址：[http://localhost:8080/admin/employee/login](http://localhost:8080/admin/employee/login)



              **前端请求地址**                                                                                       ****

                 <!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791274376224-35244931-34c1-4df3-87da-24aedb9b8bf3.png)              

**后端接口地址**

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791274458256-1e953563-c2c8-4e83-9b41-e85842e51798.png)

很明显，两个地址不一致，那是如何请求到后端服务的呢？

<!-- 这是一张图片，ocr 内容为： -->


> 图片暂缺：前端请求经 Nginx 转发到后端接口的示意图。原笔记引用的本地图片未随文提供。





**1). nginx反向代理**

**nginx 反向代理**，就是将前端发送的动态请求由 nginx 转发到后端服务器

**nginx 反向代理的好处：**

+ 提高访问速度因为nginx本身可以进行缓存，如果访问的同一接口，并且做了数据缓存，nginx就直接可把数据返回，不需要真正地访问服务端，从而提高访问速度。
+ 进行负载均衡所谓负载均衡,就是把大量的请求按照我们指定的方式均衡的分配给集群中的每台服务器。
+ 保证后端服务安全因为一般后台服务地址不会暴露，所以使用浏览器不能直接访问，可以把nginx作为请求访问的入口，请求到达nginx后转发到具体的服务中，从而保证后端服务的安全。

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791274882013-1658fc80-6f25-4394-ae73-d58ac60d5962.png)

**nginx 反向代理的配置方式：**

```nginx
server{
    listen 80;
    server_name localhost;
    
    location /api/{
        proxy_pass http://localhost:8080/admin/; #反向代理
    }
}
```

**proxy_pass：**该指令是用来设置代理服务器的地址，可以是主机名称，IP地址加端口号等形式。

如上代码的含义是：监听80端口号， 然后当我们访问 http://localhost:80/api/../..这样的接口的时候，它会通过 location /api/ {} 这样的反向代理到 http://localhost:8080/admin/上来。



接下来，进到nginx-1.20.2\conf，打开nginx配置

```nginx
# 反向代理,处理管理端发送的请求
location /api/ {
    proxy_pass   http://localhost:8080/admin/;
    #proxy_pass   http://webservers/admin/;
}
```

当在访问http://localhost/api/employee/login，nginx接收到请求后转到http://localhost:8080/admin/，故最终的请求地址为http://localhost:8080/admin/employee/login，和后台服务的访问地址一致。



**2). nginx 负载均衡**

当如果服务以集群的方式进行部署时，那nginx在转发请求到服务器时就需要做相应的负载均衡。其实，负载均衡从本质上来说也是基于反向代理来实现的，最终都是转发请求。



>  问题： nginx实际开发中部署在哪里，客户端吗
>
> deepseek: Nginx 在实际开发中，一定是部署在**服务端**（或者更准确地说，是服务端的基础设施层）
>
> **开发环境（你现在的状态）：**
>
> 浏览器 (客户端)
>
>    ↓ 请求 [http://localhost/api/employee/login](http://localhost/api/employee/login) (端口80)
>
> Nginx (部署在你的Windows电脑上，或Linux虚拟机中)
>
>    ↓ 反向代理，负载均衡
>
> Spring Boot 后端集群 (部署在本地IDEA，端口8080、8081等)
>
> **实际生产环境（真实上线）：**
>
> 用户手机/浏览器 (客户端)
>
>    ↓ 请求 https://api.changqiong.com/api/employee/login (公网域名)
>
> 云服务器 (公网IP) 上的 Nginx (监听80/443端口)
>
>    ↓ 负载均衡
>
> 内网服务器集群 (多台Linux服务器，运行Spring Boot Jar包，端口8080)
>

**nginx 负载均衡的配置方式：**

```nginx
upstream webservers{
    server 192.168.100.128:8080;
    server 192.168.100.129:8080;
}
server{
    listen 80;
    server_name localhost;
    
    location /api/{
        proxy_pass http://webservers/admin;#负载均衡
    }
}
```

**upstream：**如果代理服务器是一组服务器的话，我们可以使用upstream指令配置后端服务器组。

如上代码的含义是：监听80端口号， 然后当我们访问 [http://localhost:80/api/../..这样的接口的时候，它会通过](http://localhost:80/api/../..这样的接口的时候，它会通过) location /api/ {} 这样的反向代理到 [http://webservers/admin，根据webservers名称找到一组服务器，根据设置的负载均衡策略(默认是轮询)转发到具体的服务器。](http://webservers/admin，根据webservers名称找到一组服务器，根据设置的负载均衡策略(默认是轮询)转发到具体的服务器。)

**注：**upstream后面的名称可自定义，但要上下保持一致。



**nginx 负载均衡策略：**

| **名称** | **说明** |
| --- | --- |
| 轮询 | 默认方式 |
| weight | 权重方式，默认为1，权重越高，被分配的客户端请求就越多 |
| ip_hash | 依据ip分配方式，这样每个访客可以固定访问一个后端服务 |
| least_conn | 依据最少连接方式，把请求优先分配给连接数少的后端服务 |
| url_hash | 依据url分配方式，这样相同的url会被分配到同一个后端服务 |
| fair | 依据响应时间方式，响应时间短的服务将会被优先分配 |


具体配置方式：

**轮询：**

```nginx
upstream webservers{
    server 192.168.100.128:8080;
    server 192.168.100.129:8080;
}
```

**weight:**

```nginx
upstream webservers{
    server 192.168.100.128:8080 weight=90;
    server 192.168.100.129:8080 weight=10;
}
```

**ip_hash:**

```nginx
upstream webservers{
    ip_hash;
    server 192.168.100.128:8080;
    server 192.168.100.129:8080;
}
```

**least_conn:**

```nginx
upstream webservers{
    least_conn;
    server 192.168.100.128:8080;
    server 192.168.100.129:8080;
}
```

**url_hash:**

```nginx
upstream webservers{
    hash &request_uri;
    server 192.168.100.128:8080;
    server 192.168.100.129:8080;
}
```

**fair:**

```nginx
upstream webservers{
    server 192.168.100.128:8080;
    server 192.168.100.129:8080;
    fair;
}
```

## 3 完善登录功能
**问题：**员工表中的密码是明文存储，安全性太低。（早知道看完再写笔记了hhh）

**解决思路：**

1. 将密码加密后存储，提高安全性
2. 使用MD5加密方式对明文密码加密

**实现步骤：**

1. 修改数据库中明文密码，改为MD5加密后的密文

打开employee表，修改密码

2. 修改Java代码，前端提交的密码进行MD5加密后再跟数据库中密码比对

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791275047261-a1e0129d-7861-475a-ac8e-a006c73a5877.png)

打开EmployeeServiceImpl.java，修改比对密码

```java
/**
     * 员工登录
     *
     * @param employeeLoginDTO
     * @return
     */
    public Employee login(EmployeeLoginDTO employeeLoginDTO) {

        //1、根据用户名查询数据库中的数据
       
        //2、处理各种异常情况（用户名不存在、密码不对、账号被锁定）
        //.......
        //密码比对
        // TODO 后期需要进行md5加密，然后再进行比对
        password = DigestUtils.md5DigestAsHex(password.getBytes());
        if (!password.equals(employee.getPassword())) {
            //密码错误
            throw new PasswordErrorException(MessageConstant.PASSWORD_ERROR);
        }

        //........

        //3、返回实体对象
        return employee;
    }
```

## 4. 导入接口文档
前后端分离开发方式要求我们之前需要先将接口定义好，这样前后端人员才能并行开发，所以，这个章节就需要将接口文档导入到管理平台，为我们后面业务开发做好准备。

其实，在真实的企业开发中，接口设计过程其实是一个非常漫长的过程，可能需要多次开会讨论调整，甚至在开发的过程中才会发现某些接口定义还需要再调整，这种情况其实是非常常见的，但是由于项目时间原因，所以选择一次性导入所有的接口



### 4.1 前后端分离开发流程
第一步：定义接口，确定接口的路径、请求方式、传入参数、返回参数。

第二步：前端开发人员和后端开发人员并行开发，同时，也可自测。

第三步：前后端人员进行连调测试。

第四步：提交给测试人员进行最终测试。

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791275179151-7f15f4eb-5096-42d9-aba5-19fdc0878919.png)

### 4.2 操作步骤
将课程资料中提供的项目接口导入YApi。访问地址：[http://yapi.smart-xwork.cn/](http://yapi.smart-xwork.cn/)

**1). 从资料中找到项目接口文件**

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791275199906-fc6dadd5-ab7a-4887-9818-e0ac2dfbd88f.png)

**2). 导入到YApi平台（暂时懒得导入，所以没有截图）**



在YApi平台创建出两个项目

选择苍穹外卖-管理端接口.json导入

导入成功

另一个用户端json文件也执行相同操作。



## 5. Swagger
### 5.1 介绍
Swagger 是一个规范和完整的框架，用于生成、描述、调用和可视化 RESTful 风格的 Web 服务([https://swagger.io/](https://swagger.io/))。 它的主要作用是：

1. 使得前后端分离开发更加方便，有利于团队协作
2. 接口的文档在线自动生成，降低后端开发人员编写接口文档的负担
3. 功能测试 Spring已经将Swagger纳入自身的标准，建立了Spring-swagger项目，现在叫Springfox。通过在项目中引入Springfox ，即可非常简单快捷的使用Swagger。

knife4j是为Java MVC框架集成Swagger生成Api文档的增强解决方案,前身是swagger-bootstrap-ui,取名kni4j是希望它能像一把匕首一样小巧,轻量,并且功能强悍!

目前，一般都使用knife4j框架。



### 5.2 使用步骤
1. 导入 knife4j 的maven坐标在pom.xml中添加依赖

```xml
<dependency>
   <groupId>com.github.xiaoymin</groupId>
   <artifactId>knife4j-spring-boot-starter</artifactId>
</dependency>

```

2. 在配置类中加入 knife4j 相关配置WebMvcConfiguration.java

```java
/**
     * 通过knife4j生成接口文档
     * @return
*/
    @Bean
    public Docket docket() {
        ApiInfo apiInfo = new ApiInfoBuilder()
                .title("苍穹外卖项目接口文档")
                .version("2.0")
                .description("苍穹外卖项目接口文档")
                .build();
        Docket docket = new Docket(DocumentationType.SWAGGER_2)
                .apiInfo(apiInfo)
                .select()
                .apis(RequestHandlerSelectors.basePackage("com.sky.controller"))
                .paths(PathSelectors.any())
                .build();
        return docket;
    }
```

3. 设置静态资源映射，否则接口文档页面无法访问WebMvcConfiguration.java

```java
/**
     * 设置静态资源映射
     * @param registry
*/
protected void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/doc.html").addResourceLocations("classpath:/META-INF/resources/");
        registry.addResourceHandler("/webjars/**").addResourceLocations("classpath:/META-INF/resources/webjars/");
}
```

4. 访问测试接口文档访问路径为 [http://ip:port/doc.html](http://ip:port/doc.html) ---> [http://localhost:8080/doc.html](http://localhost:8080/doc.html)接口测试:测试登录功能

**思考：**通过 Swagger 就可以生成接口文档，那么我们就不需要 Yapi 了？

1、Yapi 是设计阶段使用的工具，管理和维护接口

2、Swagger 在开发阶段使用的框架，帮助后端开发人员做后端的接口测试



### 5.3 常用注解
通过注解可以控制生成的接口文档，使接口文档拥有更好的可读性，常用注解如下：

| **注解** | **说明** |
| --- | --- |
| @Api | 用在类上，例如Controller，表示对类的说明 |
| @ApiModel | 用在类上，例如entity、DTO、VO |
| @ApiModelProperty | 用在属性上，描述属性信息 |
| @ApiOperation | 用在方法上，例如Controller的方法，说明方法的用途、作用 |


接下来，使用上述注解，生成可读性更好的接口文档

在sky-pojo模块中

EmployeeLoginDTO.java

```java
package com.sky.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.io.Serializable;

@Data
@ApiModel(description = "员工登录时传递的数据模型")
public class EmployeeLoginDTO implements Serializable {

    @ApiModelProperty("用户名")
    private String username;

    @ApiModelProperty("密码")
    private String password;

}

```

EmployeeLoginVo.java

```java
package com.sky.vo;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(description = "员工登录返回的数据格式")
public class EmployeeLoginVO implements Serializable {

    @ApiModelProperty("主键值")
    private Long id;

    @ApiModelProperty("用户名")
    private String userName;

    @ApiModelProperty("姓名")
    private String name;

    @ApiModelProperty("jwt令牌")
    private String token;

}
```

在sky-server模块中

EmployeeController.java

```java
package com.sky.controller.admin;

import com.sky.constant.JwtClaimsConstant;
import com.sky.dto.EmployeeLoginDTO;
import com.sky.entity.Employee;
import com.sky.properties.JwtProperties;
import com.sky.result.Result;
import com.sky.service.EmployeeService;
import com.sky.utils.JwtUtil;
import com.sky.vo.EmployeeLoginVO;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

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
    public Result<EmployeeLoginVO> login(@RequestBody EmployeeLoginDTO employeeLoginDTO) 	{
        //..............

        
    }

    /**
     * 退出
     *
     * @return
     */
    @PostMapping("/logout")
    @ApiOperation("员工退出")
    public Result<String> logout() {
        return Result.success();
    }

}

```

启动服务：访问[http://localhost:8080/doc.html](http://localhost:8080/doc.html)

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1791276105905-4f7e448c-0583-4ab4-9494-da8a2a80d968.png)



