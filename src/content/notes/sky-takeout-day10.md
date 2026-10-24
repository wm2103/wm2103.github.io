---
title: "苍穹外卖 Day 10：定时任务与 WebSocket"
description: "学习 Spring Task 和 cron 表达式，记录订单状态定时处理、WebSocket 来单提醒与用户催单。"
category: "web"
tags: ["Spring Task","WebSocket","定时任务","苍穹外卖"]
cover: "sky"
importedAt: "2026-10-24"
series: "sky-takeout"
seriesOrder: 10
sourceLabel: "黑马程序员《苍穹外卖》课程学习笔记，含个人批注与调试记录"
---

> 这节课主要是 Spring Task，了解下cron表达式，还有WebSocket，感觉挺常见的，没有讲更细节的东西
>

## 课程内容
+ Spring Task
+ 订单状态定时处理
+ WebSocket
+ 来单提醒
+ 客户催单



功能实现：**订单状态定时处理**、**来单提醒**和**客户催单**

**订单状态定时处理：**

**来单提醒：**

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792150883226-9b0a01f3-9e59-4e6c-ac6f-b19ffe9ea86c.png)

**客户催单：**

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792150894136-1f235e8d-3214-4721-bca5-17eb3362892c.png)

## 1. Spring Task
### 1.1 介绍
**Spring Task** 是Spring框架提供的任务调度工具，可以按照约定的时间自动执行某个代码逻辑。

**定位：**定时任务框架

**作用：**定时自动执行某段Java代码



  为什么要在Java程序中使用Spring Task？

**应用场景：**

1). 信用卡每月还款提醒

2). 银行贷款每月还款提醒

3). 火车票售票系统处理未支付订单

4). 入职纪念日为用户发送通知

**强调：**只要是需要定时处理的场景都可以使用Spring Task



### 1.2 cron表达式
**cron表达式**其实就是一个字符串，通过cron表达式可以**定义任务触发的时间**

**构成规则：**分为6或7个域，由空格分隔开，每个域代表一个含义

每个域的含义分别为：秒、分钟、小时、日、月、周、年(可选)

**举例：**

2022年10月12日上午9点整 对应的cron表达式为：**0 0 9 12 10 ? 2022**

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792150932589-22e0e5ae-e289-4a90-ac61-cb52fc55c51b.png)

**说明：**一般**日**和**周**的值不同时设置，其中一个设置，另一个用？表示。



**比如：**描述2月份的最后一天，最后一天具体是几号呢？可能是28号，也有可能是29号，所以就不能写具体数字。

为了描述这些信息，提供一些特殊的字符。这些具体的细节，我们就不用自己去手写，因为这个cron表达式，它其实有在线生成器。

cron表达式在线生成器：[https://cron.qqe2.com/](https://cron.qqe2.com/)

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792150985022-5a4a5feb-67a3-4e97-a2bf-ba248cd88508.png)

可以直接在这个网站上面，只要根据自己的要求去生成corn表达式即可。所以一般就不用自己去编写这个表达式。

**通配符：**

* 表示所有值； 

? 表示未说明的值，即不关心它为何值； 

- 表示一个指定的范围； 

, 表示附加一个可能值； 

/ 符号前表示开始时间，符号后表示每次递增的值；

**cron表达式案例：**

*/5 * * * * ? 每隔5秒执行一次

0 */1 * * * ? 每隔1分钟执行一次

0 0 5-15 * * ? 每天5-15点整点触发

0 0/3 * * * ? 每三分钟触发一次

0 0-5 14 * * ? 在每天下午2点到下午2:05期间的每1分钟触发 

0 0/5 14 * * ? 在每天下午2点到下午2:55期间的每5分钟触发

0 0/5 14,18 * * ? 在每天下午2点到2:55期间和下午6点到6:55期间的每5分钟触发

0 0/30 9-17 * * ? 朝九晚五工作时间内每半小时

0 0 10,14,16 * * ? 每天上午10点，下午2点，4点 



### 1.3 入门案例
#### 1.3.1 Spring Task使用步骤
1). 导入maven坐标 spring-context（已存在）

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792153314891-a4f3bd36-a85c-4a29-90fa-bc9bc2246860.png)

2). 启动类添加注解 @EnableScheduling 开启任务调度

3). 自定义定时任务类



#### 1.3.2 代码开发
**编写定时任务类：**

进入sky-server模块中

```java
package com.sky.task;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Date;

/**
 * 自定义定时任务类
 */
@Component
@Slf4j
public class MyTask {

    /**
     * 定时任务 每隔5秒触发一次
     */
    @Scheduled(cron = "0/5 * * * * ?")
    public void executeTask(){
        log.info("定时任务开始执行：{}",new Date());
    }
}
```

**开启任务调度：**

启动类添加注解 @EnableScheduling

```java
package com.sky;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication
@EnableTransactionManagement //开启注解方式的事务管理
@Slf4j
@EnableCaching
@EnableScheduling
public class SkyApplication {
    public static void main(String[] args) {
        SpringApplication.run(SkyApplication.class, args);
        log.info("server started");
    }
}
```



#### 1.3.3 功能测试
启动服务，查看日志

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792153465830-8c347210-2be3-4773-8ac4-fd02b268583f.png)

每隔5秒执行一次。



## 2.订单状态定时处理
### 2.1 需求分析
用户下单后可能存在的情况：

+ 下单后未支付，订单一直处于**“待支付”**状态
+ 用户收货后管理端未点击完成按钮，订单一直处于**“派送中”**状态

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792153577757-c49304e3-b2a5-42a4-9372-0d98b1bedc7c.png)

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792153589328-9e73a038-03e6-48c9-bda7-5a686a9101ac.png)

支付超时的订单如何处理？ 派送中的订单一直不点击完成如何处理？

对于上面两种情况需要通过**定时任务**来修改订单状态，具体逻辑为：

+ 通过定时任务每分钟检查一次是否存在支付超时订单（下单后超过15分钟仍未支付则判定为支付超时订单），如果存在则修改订单状态为“已取消”
+ 通过定时任务每天凌晨1点检查一次是否存在“派送中”的订单，如果存在则修改订单状态为“已完成”

### 2.2 代码开发
**1). 自定义定时任务类OrderTask（待完善）：**

```java
package com.sky.task;

/**
 * 自定义定时任务，实现订单状态定时处理
 */
@Component
@Slf4j
public class OrderTask {

    @Autowired
    private OrderMapper orderMapper;

    /**
     * 处理支付超时订单
     */
    @Scheduled(cron = "0 * * * * ?")
    public void processTimeoutOrder(){
        log.info("处理支付超时订单：{}", new Date());
    }

    /**
     * 处理“派送中”状态的订单
     */
    @Scheduled(cron = "0 0 1 * * ?")
    public void processDeliveryOrder(){
        log.info("处理派送中订单：{}", new Date());
    }

}
```

> 讲解下 @Scheduled(cron = "0 * * * * ?") @Scheduled(cron = "0 0 1 * * ?")
>
> #### `@Scheduled(cron = "0 * * * * ?")` —— 每分钟执行一次
> 拆分来看：
>
> + 秒：`0` → 第 0 秒
> + 分：`*` → 每分钟
> + 时：`*` → 每小时
> + 日：`*` → 每天
> + 月：`*` → 每月
> + 周：`?` → 不指定
>
> **含义**：**在每一分钟的第 0 秒执行一次**（即每分钟执行一次）。
>
> #### `@Scheduled(cron = "0 0 1 * * ?")` —— 每天凌晨1点执行
> 拆分来看：
>
> + 秒：`0` → 第 0 秒
> + 分：`0` → 第 0 分
> + 时：`1` → 凌晨 1 点
> + 日：`*` → 每天
> + 月：`*` → 每月
> + 周：`?` → 不指定
>
> **含义**：**每天凌晨 1 点整执行一次**。
>

**2). 在OrderMapper接口中扩展方法:**

```java
/**
     * 根据状态和下单时间查询订单
     * @param status
     * @param orderTime
     */
    @Select("select * from orders where status = #{status} and order_time < #{orderTime}")
    List<Orders> getByStatusAndOrdertimeLT(Integer status, LocalDateTime orderTime);
```

**3). 完善定时任务类的processTimeoutOrder方法：**

```java
/**
     * 处理支付超时订单
     */
    @Scheduled(cron = "0 * * * * ?")
    public void processTimeoutOrder(){
        log.info("处理支付超时订单：{}", new Date());

        LocalDateTime time = LocalDateTime.now().plusMinutes(-15);

        // select * from orders where status = 1 and order_time < 当前时间-15分钟
        List<Orders> ordersList = orderMapper.getByStatusAndOrdertimeLT(Orders.PENDING_PAYMENT, time);
        if(ordersList != null && ordersList.size() > 0){
            ordersList.forEach(order -> {
                order.setStatus(Orders.CANCELLED);
                order.setCancelReason("支付超时，自动取消");
                order.setCancelTime(LocalDateTime.now());
                orderMapper.update(order);
            });
        }
    }
```

> 
>

**4). 完善定时任务类的processDeliveryOrder方法：**

```java
/**
     * 处理“派送中”状态的订单
     */
    @Scheduled(cron = "0 0 1 * * ?")
    public void processDeliveryOrder(){
        log.info("处理派送中订单：{}", new Date());
        // select * from orders where status = 4 and order_time < 当前时间-1小时
        LocalDateTime time = LocalDateTime.now().plusMinutes(-60);
        List<Orders> ordersList = orderMapper.getByStatusAndOrdertimeLT(Orders.DELIVERY_IN_PROGRESS, time);

        if(ordersList != null && ordersList.size() > 0){
            ordersList.forEach(order -> {
                order.setStatus(Orders.COMPLETED);
                orderMapper.update(order);
            });
        }
    }
```

### 2.3 功能测试
可以通过如下方式进行测试：

+ 查看控制台sql
+ 查看数据库中数据变化

**支付超时的订单测试：**

**1). 查看订单表**

有一条订单，状态为1。订单状态 1待付款 2待接单 3已接单 4派送中 5已完成 6已取消

**2). 开启定时任务**

启动服务，观察控制台日志。处理支付超时订单任务每隔1分钟执行一次。

**3). 再次查看订单表**

状态已更改为6，已取消。

证明定时任务已生效。

**处理“派送中”状态的订单任务**测试自已完成，测试步骤和上述一致。可适当修改cron表达式，改变任务执行频率，方便测试。

## 3. WebSocket
### 3.1 介绍
WebSocket 是基于 TCP 的一种新的**网络协议**。它实现了浏览器与服务器全双工通信——浏览器和服务器只需要完成一次握手，两者之间就可以创建**持久性**的连接， 并进行**双向**数据传输。

**HTTP协议和WebSocket协议对比：**

+ HTTP是**短连接**
+ WebSocket是**长连接**
+ HTTP通信是**单向**的，基于请求响应模式
+ WebSocket支持**双向**通信
+ HTTP和WebSocket底层都是TCP连接

            <!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792154168202-0a8a8048-f8fd-4a12-973f-77947a4638f0.png)

**思考：**既然WebSocket支持双向通信，功能看似比HTTP强大，那么我们是不是可以基于WebSocket开发所有的业务功能？

**WebSocket缺点：**

服务器长期维护长连接需要一定的成本  
各个浏览器支持程度不一  
WebSocket 是长连接，受网络限制比较大，需要处理好重连

**结论：**WebSocket并不能完全取代HTTP，它只适合在特定的场景下使用



**WebSocket应用场景：**

1). 视频弹幕

2). 网页聊天

3). 体育实况更新

4). 股票基金报价实时更新

### 3.2 入门案例
#### 3.2.1 案例分析
**需求：**实现浏览器与服务器全双工通信。浏览器既可以向服务器发送消息，服务器也可主动向浏览器推送消息。

**效果展示：**

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792154254818-caff2fb8-76ac-431f-8d21-67fefccbcf97.png)

**实现步骤：**

1). 直接使用websocket.html页面作为WebSocket客户端

2). 导入WebSocket的maven坐标

3). 导入WebSocket服务端组件WebSocketServer，用于和客户端通信

4). 导入配置类WebSocketConfiguration，注册WebSocket的服务端组件

5). 导入定时任务类WebSocketTask，定时向客户端推送数据



#### 3.2.2 代码开发
1). 定义websocket.html页面(资料中已提供)

```html
<!DOCTYPE HTML>
<html>
<head>
    <meta charset="UTF-8">
    <title>WebSocket Demo</title>
</head>
<body>
    <input id="text" type="text" />
    <button onclick="send()">发送消息</button>
    <button onclick="closeWebSocket()">关闭连接</button>
    <div id="message">
    </div>
</body>
<script type="text/javascript">
    var websocket = null;
    var clientId = Math.random().toString(36).substr(2);

    //判断当前浏览器是否支持WebSocket
    if('WebSocket' in window){
        //连接WebSocket节点
        websocket = new WebSocket("ws://localhost:8080/ws/"+clientId);
    }
    else{
        alert('Not support websocket')
    }

    //连接发生错误的回调方法
    websocket.onerror = function(){
        setMessageInnerHTML("error");
    };

    //连接成功建立的回调方法
    websocket.onopen = function(){
        setMessageInnerHTML("连接成功");
    }

    //接收到消息的回调方法
    websocket.onmessage = function(event){
        setMessageInnerHTML(event.data);
    }

    //连接关闭的回调方法
    websocket.onclose = function(){
        setMessageInnerHTML("close");
    }

    //监听窗口关闭事件，当窗口关闭时，主动去关闭websocket连接，防止连接还没断开就关闭窗口，server端会抛异常。
    window.onbeforeunload = function(){
        websocket.close();
    }

    //将消息显示在网页上
    function setMessageInnerHTML(innerHTML){
        document.getElementById('message').innerHTML += innerHTML + '<br/>';
    }

    //发送消息
    function send(){
        var message = document.getElementById('text').value;
        websocket.send(message);
    }
    
    //关闭连接
    function closeWebSocket() {
        websocket.close();
    }
</script>
</html>

```



2). 导入maven坐标

在sky-server模块pom.xml中已定义

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>

```



3). 定义WebSocket服务端组件(资料中已提供)

直接导入到sky-server模块即可

```java
package com.sky.websocket;

import org.springframework.stereotype.Component;
import javax.websocket.OnClose;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.PathParam;
import javax.websocket.server.ServerEndpoint;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

/**
 * WebSocket服务
 */
@Component
@ServerEndpoint("/ws/{sid}")
public class WebSocketServer {

    //存放会话对象
    private static Map<String, Session> sessionMap = new HashMap();

    /**
     * 连接建立成功调用的方法
     */
    @OnOpen
    public void onOpen(Session session, @PathParam("sid") String sid) {
        System.out.println("客户端：" + sid + "建立连接");
        sessionMap.put(sid, session);
    }

    /**
     * 收到客户端消息后调用的方法
     *
     * @param message 客户端发送过来的消息
     */
    @OnMessage
    public void onMessage(String message, @PathParam("sid") String sid) {
        System.out.println("收到来自客户端：" + sid + "的信息:" + message);
    }

    /**
     * 连接关闭调用的方法
     *
     * @param sid
     */
    @OnClose
    public void onClose(@PathParam("sid") String sid) {
        System.out.println("连接断开:" + sid);
        sessionMap.remove(sid);
    }

    /**
     * 群发
     *
     * @param message
     */
    public void sendToAllClient(String message) {
        Collection<Session> sessions = sessionMap.values();
        for (Session session : sessions) {
            try {
                //服务器向客户端发送消息
                session.getBasicRemote().sendText(message);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

}
```

> 代码讲解：
>
> + `@ServerEndpoint("/ws/{sid}")`：声明这是一个 WebSocket 服务端。前端连接地址类似 `ws://localhost:8080/ws/123`。
> + `{sid}`：路径参数，作为客户端的唯一标识（苍穹外卖里通常传管理员的 ID 或 UUID）。
> + `@Component`：让 Spring 管理这个 Bean（**但注意**：WebSocket 每建立一个连接，都会 new 一个新的 `WebSocketServer` 实例，`@Component` 只是为了 Spring 能扫描到它，不能靠它实现单例）。
>
> private static Map<String, Session> sessionMap = new HashMap();
>
> + **为什么必须是 **`**static**`**？**  
因为每次客户端连接，WebSocket 都会创建一个新的 `WebSocketServer` 对象。如果不加 `static`，这个 Map 就是每个连接私有的，无法实现“给所有客户端群发消息”。
> + **为什么用 **`**Map**`**？**  
存 `<sid, Session>` 的映射。`Session` 是 WebSocket 的会话对象，代表一个客户端连接。通过 `Session` 才能给对应客户端发消息。
> + **坑点**：`HashMap` 是**线程不安全**的。多个客户端同时连接、断开时，可能会引发并发修改异常（`ConcurrentModificationException`）。**生产环境建议改用 **`**ConcurrentHashMap**`。
>
> 实战避坑指南（面试高频）
>
> 1. `@Autowired` 注入失效问题
>
> 如果你在 `WebSocketServer` 里用 `@Autowired` 注入 `OrderService`，会发现**注入为 null**。  
**原因**：WebSocket 每个连接都会 new 一个新实例，而 Spring 默认是单例。新实例不会走 Spring 的依赖注入流程。  
**解法**：
>
> + 方案 A：用 `static` 字段 + `@Autowired` 的 setter 方法注入。
> + 方案 B：通过 `ApplicationContext` 手动获取 Bean。
>
> 2. 集群部署下的 Session 不共享
>
> 如果苍穹外卖部署了 3 台服务器，用户连接到了服务器 A，但下单请求被 Nginx 转发到了服务器 B。服务器 B 的 `sessionMap` 里没有用户的 Session，消息推送失败。  
**解法**：用 **Redis 发布订阅（Pub/Sub）** 或 **MQ（RabbitMQ/Kafka）** 做广播。消息发到 Redis，所有服务器订阅后，各自推送给本机连接的客户端。
>
> 3. 心跳保活机制
>
> WebSocket 长连接可能因为网络波动、防火墙超时被断开。前端通常需要每隔 30 秒发一个 `ping` 消息，后端回 `pong`，保持连接活跃。
>
> 4. 线程安全
>
> `sessionMap` 建议改成：
>
> private static Map<String, Session> sessionMap = new ConcurrentHashMap<>();
>
> 并且在 `sendToAllClient` 里，如果发送失败，要及时把失效的 Session 移除。
>
> 5. `System.out.println` 替换为日志
>
> 生产环境不要用 `System.out.println`，应该用 `@Slf4j` 的 `log.info`。
>

4). 定义配置类，注册WebSocket的服务端组件(从资料中直接导入即可)

```java
package com.sky.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.server.standard.ServerEndpointExporter;

/**
 * WebSocket配置类，用于注册WebSocket的Bean
 */
@Configuration
public class WebSocketConfiguration {

    @Bean
    public ServerEndpointExporter serverEndpointExporter() {
        return new ServerEndpointExporter();
    }

}
```



5). 定义定时任务类，定时向客户端推送数据(从资料中直接导入即可)

```java
package com.sky.task;

import com.sky.websocket.WebSocketServer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Component
public class WebSocketTask {
    @Autowired
    private WebSocketServer webSocketServer;

    /**
     * 通过WebSocket每隔5秒向客户端发送消息
     */
    @Scheduled(cron = "0/5 * * * * ?")
    public void sendMessageToClient() {
        webSocketServer.sendToAllClient("这是来自服务端的消息：" + DateTimeFormatter.ofPattern("HH:mm:ss").format(LocalDateTime.now()));
    }
}
```



#### 3.2.3 功能测试
启动服务，打开websocket.html页面

**浏览器向服务器发送数据：**

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792155106228-3681b531-9734-4a66-ae96-afadedf38b9d.png)

**服务器向浏览器间隔5秒推送数据：**

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792155114228-811dd957-0d66-4a58-ae98-7ee4b52aaa62.png)

> 发现浏览器F12 里面网络是空的
>
> <!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792155254123-0936c16d-16d1-4816-bfcd-81df5d487975.png)
>
> 结果是没选全部...选了全部就有了
>
> <!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792155230111-71764119-969c-4cd0-a41e-1cff8c6c7b2a.png)
>

## 4. 来单提醒
### 4.1 需求分析和设计
用户下单并且支付成功后，需要第一时间通知外卖商家。通知的形式有如下两种：

+ 语音播报  
+ 弹出提示框

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792154960299-fe5d45ea-d3ba-460d-8330-0ea609caf96a.png)

**设计思路：**

+ 通过WebSocket实现管理端页面和服务端保持长连接状态
+ 当客户支付后，调用WebSocket的相关API实现服务端向客户端推送消息
+ 客户端浏览器解析服务端推送的消息，判断是来单提醒还是客户催单，进行相应的消息提示和语音播报
+ 约定服务端发送给客户端浏览器的数据格式为JSON，字段包括：type，orderId，content
    - type 为消息类型，1为来单提醒 2为客户催单
    - orderId 为订单id
    - content 为消息内容



### 4.2 代码开发
**在OrderServiceImpl中注入WebSocketServer对象，修改paySuccess方法，加入如下代码：**

```java
    @Autowired
    private WebSocketServer webSocketServer;
    /**
     * 支付成功，修改订单状态
     *
     * @param outTradeNo
     */
    public void paySuccess(String outTradeNo) {
        // 当前登录用户id
        Long userId = BaseContext.getCurrentId();

        // 根据订单号查询当前用户的订单
        Orders ordersDB = orderMapper.getByNumberAndUserId(outTradeNo, userId);

        // 根据订单id更新订单的状态、支付方式、支付状态、结账时间
        Orders orders = Orders.builder()
                .id(ordersDB.getId())
                .status(Orders.TO_BE_CONFIRMED)
                .payStatus(Orders.PAID)
                .checkoutTime(LocalDateTime.now())
                .build();

        orderMapper.update(orders);
        //////////////////////////////////////////////
        Map map = new HashMap();
        map.put("type", 1);//消息类型，1表示来单提醒
        map.put("orderId", orders.getId());
        map.put("content", "订单号：" + outTradeNo);

        //通过WebSocket实现来单提醒，向客户端浏览器推送消息
        webSocketServer.sendToAllClient(JSON.toJSONString(map));
        ///////////////////////////////////////////////////
    }
```



### 4.3 功能测试
可以通过如下方式进行测试：

+ 查看浏览器调试工具数据交互过程
+ 前后端联调

**1). 登录管理端后台**

登录成功后，浏览器与服务器建立长连接

查看控制台日志

**2). 小程序端下单支付**

修改回调地址，利用内网穿透获取域名

下单支付

   



**3). 查看来单提醒**

支付成功后，后台收到来单提醒，并有语音播报



## 5. 客户催单
### 5.1 需求分析和设计
用户在小程序中点击催单按钮后，需要第一时间通知外卖商家。通知的形式有如下两种：

+ 语音播报 
+ 弹出提示框

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792155341399-d65ad707-9887-4a87-afb8-51ddbaec69a2.png)

**设计思路：**

+ 通过WebSocket实现管理端页面和服务端保持长连接状态
+ 当用户点击催单按钮后，调用WebSocket的相关API实现服务端向客户端推送消息
+ 客户端浏览器解析服务端推送的消息，判断是来单提醒还是客户催单，进行相应的消息提示和语音播报  
约定服务端发送给客户端浏览器的数据格式为JSON，字段包括：type，orderId，content
    - type 为消息类型，1为来单提醒 2为客户催单
    - orderId 为订单id
    - content 为消息内容



当用户点击催单按钮时，向服务端发送请求。

**接口设计(催单)：**

 <!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792155348573-6c25fe68-6a72-45df-8e82-04e0316213ec.png)<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792155354393-f763a977-4436-4014-961c-7a76ddd95572.png)



### 5.2 代码开发
#### 5.2.1 Controller层
**根据用户催单的接口定义，在user/OrderController中创建催单方法：**

```java
    /**
     * 用户催单
     *
     * @param id
     * @return
     */
    @GetMapping("/reminder/{id}")
    @ApiOperation("用户催单")
    public Result reminder(@PathVariable("id") Long id) {
        orderService.reminder(id);
        return Result.success();
    }
```



#### 5.2.2 Service层接口
**在OrderService接口中声明reminder方法：**

```java
    /**
     * 用户催单
     * @param id
     */
    void reminder(Long id);
```



#### 5.2.3 Service层实现类
**在OrderServiceImpl中实现reminder方法：**

```java
    /**
     * 用户催单
     *
     * @param id
     */
    public void reminder(Long id) {
        // 查询订单是否存在
        Orders orders = orderMapper.getById(id);
        if (orders == null) {
            throw new OrderBusinessException(MessageConstant.ORDER_NOT_FOUND);
        }

        //基于WebSocket实现催单
        Map map = new HashMap();
        map.put("type", 2);//2代表用户催单
        map.put("orderId", id);
        map.put("content", "订单号：" + orders.getNumber());
        webSocketServer.sendToAllClient(JSON.toJSONString(map));
    }
```



### 5.2.4 Mapper层
**在OrderMapper中添加getById：**

```java
    /**
     * 根据id查询订单
     * @param id
     */
    @Select("select * from orders where id=#{id}")
    Orders getById(Long id);
```



### 5.3 功能测试
可以通过如下方式进行测试：

+ 查看浏览器调试工具数据交互过程
+ 前后端联调

**1). 登录管理端后台**

登录成功后，浏览器与服务器建立长连接

查看控制台日志

**2). 用户进行催单**

用户可在订单列表或者订单详情，进行催单

**3). 查看催单提醒**

既有催单弹窗，同时语音播报



