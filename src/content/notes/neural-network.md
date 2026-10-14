---
title: "神经网络：从感知器到卷积网络"
description: "梳理感知器、梯度下降、反向传播与卷积神经网络，保留 Python 实现、公式配图和原文参考资料。"
category: "ai"
tags: ["深度学习","神经网络","Python","学习笔记"]
cover: "neural"
date: "2024-04-10"
importedAt: "2026-10-14"
sourceLabel: "深度学习资料摘录与学习笔记，原文及参考链接见正文"
---

# 深度学习
[「修炼开始」一文带你入门深度学习](https://cuijiahua.com/blog/2020/11/dl-basics-2.html)
## 学习路线
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705927603966-b4c6b0f4-4773-4efb-9d75-df8971f9952d.png#averageHue=%23fbf9f7&clientId=uaba10839-7aa6-4&from=paste&id=u07130315&originHeight=2666&originWidth=2434&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=ub5d7370b-0439-4b64-9a68-43ef9b90774&title=)
深度学习主要由上图所示的几个部分组成，想学一个深度学习算法的原理，就看它是什么样的网络结构，Loss 是怎么计算的，预处理和后处理都是怎么做的。
权重初始化和学习率调整策略、优化算法、深度学习框架就那么多，并且也不是所有都要掌握，比如深度学习框架，Pytorch 玩的溜，就能应付大多数场景。
先有个整体的认知，然后再按照这个思维导图，逐个知识点学习，最后整合到一起，你会发现，**你也可以自己实现各种功能的算法了**。
深度学习的主要目的是从数据中自动学习到有效的**特征表示**，它是怎么工作的？那得从神经元说起。
随着神经科学、认知科学的发展，我们逐渐知道人类的智能行为都和大脑活动有关。
人脑神经系统[1]是一个非常复杂的组织，包含近 860 亿个神经元，这 860 亿的神经元构成了**超级庞大的神经网络**。
## 简单的前馈神经网络
而深度学习的神经网络，就是受人脑神经网络启发，设计的一种计算模型，它从结构、实现机理和功能上模拟人脑神经网络。
比如下图就是一个最简单的**前馈神经网络**，第 0 层称为**输入层**，最后一层称为**输出层**，其他中间层称为**隐藏层**。
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705927679776-22a1fe2b-b8dd-4133-9539-aab1552bc2ae.png#averageHue=%23f4f3f3&clientId=uaba10839-7aa6-4&from=paste&id=uaf324c0d&originHeight=506&originWidth=856&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=u2db99c10-b14a-44d9-803f-eda4ae30bf2&title=)
那神经网络如何工作的？网络层次结构、损失函数、优化算法、权重初始化、学习率调整都是如何运作的？
**反向传播给你答案**。前方，**高能预警**！
## 反向传播
要想弄懂深度学习原理，必须搞定反向传播[2]和链式求导法则。
先说思维导图里的**网络层级结构**，一个神经网络，可复杂可简单，为了方便推导，假设，你有这样一个网络层：
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705927713223-0ce9d556-7bfe-435e-a31d-b152b63863eb.png#averageHue=%23f8f8f8&clientId=uaba10839-7aa6-4&from=paste&height=378&id=u170fd390&originHeight=712&originWidth=892&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=u01ef31e1-52e2-4b55-818f-09f2b46e4ef&title=&width=473.4000244140625)
第一层是**输入层**，包含两个神经元 i1, i2 和截距项 b1（偏置）；
第二层是**隐含层**，包含两个神经元 h1, h2 和截距项 b2 ；
第三层是**输出层** o1 和 o2 ，每条线上标的 wi 是层与层之间连接的权重，激活函数我们默认为 sigmoid 函数。
在训练这个网络之前，需要初始化这些 wi 权重，这就是**权重初始化**，这里就有**不少的初始化方法**，我们选择最简单的，**随机初始化**。
随机初始化的结果，如下图所示：
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705927739347-baf4b277-d08f-4c22-8c32-643fc09eff3e.png#averageHue=%23f8f8f8&clientId=uaba10839-7aa6-4&from=paste&height=379&id=u577d0bc1&originHeight=736&originWidth=940&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=u112484df-33e7-4658-ab7a-19194aa9342&title=&width=484.4000244140625)
其中，输入数据: i1=0.05, i2=0.10;
输出数据（期望的输出） : o1=0.01, o2=0.99;
初始权重: w1=0.15, w2=0.20, w3=0.25, w4=0.30, w5=0.40, w6=0.45, w7=0.50, w8=0.55。
**目标**：给出输入数据 i1, i2(0.05 和 0.10)，使输出尽可能与原始输出o1, o2(0.01 和 0.99)接近。
神经网络的工作流程分为两步：[前向传播](https://cuijiahua.com/blog/tag/%e5%89%8d%e5%90%91%e4%bc%a0%e6%92%ad/)和**反向传播**。
### 1、**前向**传播
前向传播是将**输入数据根据权重，计算到输出层**。
#### 1）输入层->隐藏层
计算神经元 h1 的输入加权和：
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705927854374-5a5745c8-a9be-4391-b03c-d5949e75d016.png#averageHue=%23f8f8f8&clientId=uaba10839-7aa6-4&from=paste&height=82&id=u7df6d037&originHeight=103&originWidth=903&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=11168&status=done&style=none&taskId=u1bacaf04-3706-48c0-8d04-cdfda539ab9&title=&width=722.4)
神经元后面，要跟个**激活层**，从而引入非线性因素，这就像人的神经元一样，让细胞处于**兴奋**或**抑制**的状态。
数学模拟的形式就是通过**激活函数**，大于阈值就激活，反之抑制。
常用的激活函如**思维导图**所示，这里以非常简单的 sigmoid 激活函数为例，它的函数形式如下：
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705927880580-007bb308-b00a-4c80-927d-1c4336938562.png#averageHue=%23f9f9f9&clientId=uaba10839-7aa6-4&from=paste&height=383&id=ua4a482ea&originHeight=632&originWidth=806&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=u03b931d3-2ae3-401a-b58f-c5c9e5ede17&title=&width=488.4000244140625)
数学公式：
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705927909981-395af5b6-129f-4504-bc64-fb8102c262cf.png#averageHue=%23f9f9f9&clientId=uaba10839-7aa6-4&from=paste&height=259&id=ud8c61c41&originHeight=324&originWidth=876&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=26894&status=done&style=none&taskId=u4b5aea22-a675-4776-8f43-f44e033e8b2&title=&width=700.8)
#### 2）隐藏层->输出层
计算输出层神经元 o1 和 o2 的值：
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705927937072-54bde0c7-bfd2-4323-a374-b21b28f71760.png#averageHue=%23f4f4f4&clientId=uaba10839-7aa6-4&from=paste&height=107&id=ue371513a&originHeight=134&originWidth=912&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=20419&status=done&style=none&taskId=uef447b56-987c-4052-8ecc-56c83ea334f&title=&width=729.6)
这样前向传播的过程就结束了，根据输入值和权重，我们得到输出值为[0.75136079, 0.772928465]，与实际值（目标）[0.01, 0.99]**相差还很远**，现在我们对误差进行反向传播，更新权值，重新计算输出。
### 2、反向传播
前向传播之后，发现输出结果与期望相差甚远，这时候就要**更新权重**了。
所谓**深度学习的训练**（炼丹），**学的就是这些权重**，我们期望的是调整这些权重，让输出结果符合我们的期望。
**而更新权重的方式，依靠的就是反向传播。**
#### 1）计算总误差
一次前向传播过后，输出值（预测值）与目标值（标签值）有差距，那得衡量一下有多大差距。
衡量的方法，就是用思维导图中的**损失函数**。
损失函数也有很多，咱们还是选择一个最简单的，**均方误差（MSE loss）**。
均方误差的函数公式：
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705928023816-6eab004c-4ad8-46dc-adfe-cbd8278e8f07.png#averageHue=%23f7f7f7&clientId=uaba10839-7aa6-4&from=paste&height=334&id=ufb159426&originHeight=418&originWidth=888&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=44678&status=done&style=none&taskId=u9d5a78c3-edb4-4430-8a3c-b040401a848&title=&width=710.4)
#### 2）隐含层->输出层的权值更新
以权重参数 w5 为例，如果我们想知道 **w5 对整体误差产生了多少影响**，可以用整体误差对 w5 求偏导求出。
这是**链式法则**，它是微积分中复合函数的求导法则，就是这个：
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705928038733-413cdfb2-948f-46e6-9b94-3219d524f186.png#averageHue=%23c4c4c7&clientId=uaba10839-7aa6-4&from=paste&height=440&id=u969c5ddd&originHeight=920&originWidth=546&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=ud5149c41-e92b-4c3c-ad10-0b200162c00&title=&width=261)
根据链式法则易得：
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705928065417-33460e61-3373-482e-badd-33779f9ddaeb.png#averageHue=%23f8f8f8&clientId=uaba10839-7aa6-4&from=paste&height=76&id=u54f31925&originHeight=95&originWidth=810&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=10013&status=done&style=none&taskId=u3dba376a-03d0-4062-9e6e-5c8de490726&title=&width=648)
下面的图可以更直观的看清楚误差是怎样反向传播的：
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705928076679-3c1099d4-954e-4720-a023-5eaff2b87d7f.png#averageHue=%23f9f9f9&clientId=uaba10839-7aa6-4&from=paste&height=319&id=uf3498a09&originHeight=512&originWidth=1052&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=u43272c1f-bb90-4a09-acc4-0de43d92b9a&title=&width=656.4000244140625)
现在我们来分别计算每个式子的值：	
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705928105777-2550d979-cdff-47f0-87eb-2f0d0b0496de.png#averageHue=%23f8f8f8&clientId=uaba10839-7aa6-4&from=paste&height=404&id=u0d3d3ec5&originHeight=505&originWidth=858&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=55428&status=done&style=none&taskId=u01271b16-6abf-47b8-8c3a-c7f9d36ce40&title=&width=686.4)![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705928127121-d88fa46d-5998-4b4e-8014-5cc232e8c2a3.png#averageHue=%23f7f7f7&clientId=uaba10839-7aa6-4&from=paste&height=347&id=uea9bc94c&originHeight=434&originWidth=826&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=44767&status=done&style=none&taskId=uce6ddd54-29ae-4307-a9dc-5f940595947&title=&width=660.8)![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705928161977-8bb4a615-555c-4fb1-8f01-d85a0d143dfb.png#averageHue=%23f8f8f8&clientId=uaba10839-7aa6-4&from=paste&height=362&id=u70e606f2&originHeight=453&originWidth=812&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=44622&status=done&style=none&taskId=u2085309f-78a1-474e-9e20-0784c383eb7&title=&width=649.6)![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705928192342-39652e81-66f8-4ba9-b3d4-e305da3ffa6c.png#averageHue=%23f9f9f9&clientId=uaba10839-7aa6-4&from=paste&height=214&id=u1b1a6c06&originHeight=267&originWidth=840&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=23938&status=done&style=none&taskId=u3dc0adc3-46c1-4307-a57a-260445e0bf9&title=&width=672)
这个**更新权重的策略**，就是思维导图中的**优化算法**，![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705928275747-bcdaaebf-2877-47a6-a5cf-4c673ec3ab2a.png#averageHue=%23f9f9f9&clientId=uaba10839-7aa6-4&from=paste&height=26&id=u2f773941&originHeight=32&originWidth=42&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=460&status=done&style=none&taskId=u28fc289b-cf59-4180-825f-a75c0829b83&title=&width=33.6)是学习率，我们这里取0.5。
如果学习率要根据迭代的次数调整，那就用到了**思维导图**中的**学习率调整**。
同理，可更新w6,w7,w8:
 ![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705928314869-cb7cc972-42f7-4ad7-bffa-53c98da925cb.png#averageHue=%23fafafa&clientId=uaba10839-7aa6-4&from=paste&height=116&id=u1f807e44&originHeight=145&originWidth=882&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=11890&status=done&style=none&taskId=u0671d245-ee25-4dcc-9d3a-2fbfedbdeca&title=&width=705.6)
#### 3）隐含层->隐含层的权值更新
方法其实与上面说的差不多，但是有个地方需要变一下，在上文计算总误差对 w5 的偏导时，是从out(o1)->net(o1)->w5，但是在**隐含层之间的权值更新时**，是out(h1)->net(h1)->w1,而 out(h1) 会接受 E(o1) 和 E(o2) 两个地方传来的误差，所以**这个地方两个都要计算**。
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705928347486-405c519e-db8e-49c3-9173-290502bf8d66.png#averageHue=%23fbfbfb&clientId=uaba10839-7aa6-4&from=paste&height=423&id=u43e2cf5f&originHeight=529&originWidth=910&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=200105&status=done&style=none&taskId=u2143ca73-3631-4f1f-ab19-c03b4e5858c&title=&width=728)
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705928416870-394b79c4-afd0-456e-b6e7-500ed398e367.png#averageHue=%23f8f8f8&clientId=uaba10839-7aa6-4&from=paste&height=355&id=u23c15c85&originHeight=444&originWidth=892&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=50925&status=done&style=none&taskId=u86da5279-9dc7-44c1-bbee-33dd4e65e54&title=&width=713.6)![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705928430278-8b7da7de-3ac4-4825-bc3a-7d17031fa6c9.png#averageHue=%23f9f9f9&clientId=uaba10839-7aa6-4&from=paste&height=467&id=u99d42f6f&originHeight=584&originWidth=899&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=53510&status=done&style=none&taskId=u7a04b606-0dbd-410b-afc5-02593091afc&title=&width=719.2)![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705928449521-7c77afae-ed63-4f27-9716-14242b2168f3.png#averageHue=%23f8f8f8&clientId=uaba10839-7aa6-4&from=paste&height=631&id=u523ed331&originHeight=789&originWidth=853&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=81691&status=done&style=none&taskId=u0673ef2b-6c5a-42ac-a438-0307d93ffd0&title=&width=682.4)
这样**误差反向传播法**就完成了，最后我们再把更新的权值重新计算，不停地迭代。
在这个例子中第一次迭代之后，总误差E(total)由0.298371109下降至0.291027924。
迭代10000次后，总误差为0.000035085，输出为[0.015912196,0.984065734]（原输入为[0.01,0.99]），证明效果还是不错的。
**这就是整个神经网络的工作原理**，如果你跟着思路，顺利看到这里。那么恭喜你，深度学习的学习算是通过了一关。
## python实现
整个过程，可以用 Python 代码实现。
```python
#coding:utf-8
import random
import math

#
#   参数解释：
#   "pd_" ：偏导的前缀
#   "d_" ：导数的前缀
#   "w_ho" ：隐含层到输出层的权重系数索引
#   "w_ih" ：输入层到隐含层的权重系数的索引

class NeuralNetwork:
    LEARNING_RATE = 0.5

    def __init__(self, num_inputs, num_hidden, num_outputs, hidden_layer_weights = None, hidden_layer_bias = None, output_layer_weights = None, output_layer_bias = None):
        self.num_inputs = num_inputs

        self.hidden_layer = NeuronLayer(num_hidden, hidden_layer_bias)
        self.output_layer = NeuronLayer(num_outputs, output_layer_bias)
        self.init_weights_from_inputs_to_hidden_layer_neurons(hidden_layer_weights)
        self.init_weights_from_hidden_layer_neurons_to_output_layer_neurons(output_layer_weights)

    def init_weights_from_inputs_to_hidden_layer_neurons(self, hidden_layer_weights):
        weight_num = 0
        for h in range(len(self.hidden_layer.neurons)):
            for i in range(self.num_inputs):
                if not hidden_layer_weights:
                    self.hidden_layer.neurons[h].weights.append(random.random())
                else:
                    self.hidden_layer.neurons[h].weights.append(hidden_layer_weights[weight_num])
                weight_num += 1

    def init_weights_from_hidden_layer_neurons_to_output_layer_neurons(self, output_layer_weights):
        weight_num = 0
        for o in range(len(self.output_layer.neurons)):
            for h in range(len(self.hidden_layer.neurons)):
                if not output_layer_weights:
                    self.output_layer.neurons[o].weights.append(random.random())
                else:
                    self.output_layer.neurons[o].weights.append(output_layer_weights[weight_num])
                weight_num += 1

    def inspect(self):
        print('------')
        print('* Inputs: {}'.format(self.num_inputs))
        print('------')
        print('Hidden Layer')
        self.hidden_layer.inspect()
        print('------')
        print('* Output Layer')
        self.output_layer.inspect()
        print('------')

    def feed_forward(self, inputs):
        hidden_layer_outputs = self.hidden_layer.feed_forward(inputs)
        return self.output_layer.feed_forward(hidden_layer_outputs)

    def train(self, training_inputs, training_outputs):
        self.feed_forward(training_inputs)

        # 1. 输出神经元的值
        pd_errors_wrt_output_neuron_total_net_input = [0] * len(self.output_layer.neurons)
        for o in range(len(self.output_layer.neurons)):

            # ∂E/∂zⱼ
            pd_errors_wrt_output_neuron_total_net_input[o] = self.output_layer.neurons[o].calculate_pd_error_wrt_total_net_input(training_outputs[o])

        # 2. 隐含层神经元的值
        pd_errors_wrt_hidden_neuron_total_net_input = [0] * len(self.hidden_layer.neurons)
        for h in range(len(self.hidden_layer.neurons)):

            # dE/dyⱼ = Σ ∂E/∂zⱼ * ∂z/∂yⱼ = Σ ∂E/∂zⱼ * wᵢⱼ
            d_error_wrt_hidden_neuron_output = 0
            for o in range(len(self.output_layer.neurons)):
                d_error_wrt_hidden_neuron_output += pd_errors_wrt_output_neuron_total_net_input[o] * self.output_layer.neurons[o].weights[h]

            # ∂E/∂zⱼ = dE/dyⱼ * ∂zⱼ/∂
            pd_errors_wrt_hidden_neuron_total_net_input[h] = d_error_wrt_hidden_neuron_output * self.hidden_layer.neurons[h].calculate_pd_total_net_input_wrt_input()

        # 3. 更新输出层权重系数
        for o in range(len(self.output_layer.neurons)):
            for w_ho in range(len(self.output_layer.neurons[o].weights)):

                # ∂Eⱼ/∂wᵢⱼ = ∂E/∂zⱼ * ∂zⱼ/∂wᵢⱼ
                pd_error_wrt_weight = pd_errors_wrt_output_neuron_total_net_input[o] * self.output_layer.neurons[o].calculate_pd_total_net_input_wrt_weight(w_ho)

                # Δw = α * ∂Eⱼ/∂wᵢ
                self.output_layer.neurons[o].weights[w_ho] -= self.LEARNING_RATE * pd_error_wrt_weight

        # 4. 更新隐含层的权重系数
        for h in range(len(self.hidden_layer.neurons)):
            for w_ih in range(len(self.hidden_layer.neurons[h].weights)):

                # ∂Eⱼ/∂wᵢ = ∂E/∂zⱼ * ∂zⱼ/∂wᵢ
                pd_error_wrt_weight = pd_errors_wrt_hidden_neuron_total_net_input[h] * self.hidden_layer.neurons[h].calculate_pd_total_net_input_wrt_weight(w_ih)

                # Δw = α * ∂Eⱼ/∂wᵢ
                self.hidden_layer.neurons[h].weights[w_ih] -= self.LEARNING_RATE * pd_error_wrt_weight

    def calculate_total_error(self, training_sets):
        total_error = 0
        for t in range(len(training_sets)):
            training_inputs, training_outputs = training_sets[t]
            self.feed_forward(training_inputs)
            for o in range(len(training_outputs)):
                total_error += self.output_layer.neurons[o].calculate_error(training_outputs[o])
        return total_error

class NeuronLayer:
    def __init__(self, num_neurons, bias):

        # 同一层的神经元共享一个截距项b
        self.bias = bias if bias else random.random()

        self.neurons = []
        for i in range(num_neurons):
            self.neurons.append(Neuron(self.bias))

    def inspect(self):
        print('Neurons:', len(self.neurons))
        for n in range(len(self.neurons)):
            print(' Neuron', n)
            for w in range(len(self.neurons[n].weights)):
                print('  Weight:', self.neurons[n].weights[w])
            print('  Bias:', self.bias)

    def feed_forward(self, inputs):
        outputs = []
        for neuron in self.neurons:
            outputs.append(neuron.calculate_output(inputs))
        return outputs

    def get_outputs(self):
        outputs = []
        for neuron in self.neurons:
            outputs.append(neuron.output)
        return outputs

class Neuron:
    def __init__(self, bias):
        self.bias = bias
        self.weights = []

    def calculate_output(self, inputs):
        self.inputs = inputs
        self.output = self.squash(self.calculate_total_net_input())
        return self.output

    def calculate_total_net_input(self):
        total = 0
        for i in range(len(self.inputs)):
            total += self.inputs[i] * self.weights[i]
        return total + self.bias

    # 激活函数sigmoid
    def squash(self, total_net_input):
        return 1 / (1 + math.exp(-total_net_input))

    def calculate_pd_error_wrt_total_net_input(self, target_output):
        return self.calculate_pd_error_wrt_output(target_output) * self.calculate_pd_total_net_input_wrt_input();

    # 每一个神经元的误差是由平方差公式计算的
    def calculate_error(self, target_output):
        return 0.5 * (target_output - self.output) ** 2

    def calculate_pd_error_wrt_output(self, target_output):
        return -(target_output - self.output)

    def calculate_pd_total_net_input_wrt_input(self):
        return self.output * (1 - self.output)

    def calculate_pd_total_net_input_wrt_weight(self, index):
        return self.inputs[index]


# 文中的例子:

nn = NeuralNetwork(2, 2, 2, hidden_layer_weights=[0.15, 0.2, 0.25, 0.3], hidden_layer_bias=0.35, output_layer_weights=[0.4, 0.45, 0.5, 0.55], output_layer_bias=0.6)
for i in range(10000):
    nn.train([0.05, 0.1], [0.01, 0.09])
    print(i, round(nn.calculate_total_error([[[0.05, 0.1], [0.01, 0.09]]]), 9))


#另外一个例子，可以把上面的例子注释掉再运行一下:

# training_sets = [
#     [[0, 0], [0]],
#     [[0, 1], [1]],
#     [[1, 0], [1]],
#     [[1, 1], [0]]
# ]

# nn = NeuralNetwork(len(training_sets[0][0]), 5, len(training_sets[0][1]))
# for i in range(10000):
#     training_inputs, training_outputs = random.choice(training_sets)
#     nn.train(training_inputs, training_outputs)
#     print(i, nn.calculate_total_error(training_sets))
```
## 其他
预处理和后处理就相对简单很多，**预处理就是一些常规的图像变换操作，数据增强方法等**。
**后处理**每个任务都略有不同，比如**目标检测的非极大值抑制**等，这些内容可以放在以后再讲。
至于深度学习框架的学习，那就是另外一大块内容了，深度学习框架是一种为了深度学习开发而生的工具，库和预训练模型等资源的总和。
我们可以用 Python 实现简单的神经网络，但是复杂的神经网络，还得靠框架，框架的使用可以大幅度降低我们的开发成本。
至于学哪种框架，看个人喜好，**Pytorch** 和 Tensorflow 都行。人生苦短，我选 Pytorch。
## 学习资料推荐
学完本文，只能算是深度学习入门，还有非常多的内容需要深入学习。
推荐一些资料，方便感兴趣的读者继续研究。
视频：

- 吴恩达的深度学习公开课[3]：https://mooc.study.163.com/university/deeplearning_ai

书籍：

- 《神经网络与深度学习》
- 《PyTorch深度学习实战》

开源项目：

- Pytorch教程 1：https://github.com/yunjey/pytorch-tutorial
- Pytorch教程 2：https://github.com/pytorch/tutorials

# 神经网络定义
神经网络构成了深度学习算法的支柱。
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705845640124-860e5250-30f1-445a-8042-05ed908e24db.png#averageHue=%23e9e9e9&clientId=udcb89fa5-8bc7-4&from=paste&height=262&id=u4d20c6e3&originHeight=327&originWidth=804&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=61183&status=done&style=none&taskId=ud89cbef3-92f2-4dd5-af3e-41eb98c92f9&title=&width=643.2)

# 基础神经网络
## 1.M-P神经元模型
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705842468917-ab2470cd-0be1-4518-96d6-968e8597019c.png#averageHue=%23fbfbfa&clientId=u8574dd28-1dd0-4&from=paste&height=408&id=ua2f27835&originHeight=510&originWidth=971&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=75444&status=done&style=none&taskId=u321a32b8-d12a-4d37-84a9-392a1835da8&title=&width=776.8)
### sigmoid函数
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705842503927-efd0ac0e-e801-4df2-ac98-c46e60fa5863.png#averageHue=%23fcfcfb&clientId=u8574dd28-1dd0-4&from=paste&height=398&id=u8e4a1689&originHeight=497&originWidth=960&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=68543&status=done&style=none&taskId=u491b03ee-7bb7-4c87-9df4-d30261b4a93&title=&width=768)
# 感知机和神经网络 perceptron
**感知机：两层神经元组成**
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705884104769-941e20fe-0508-4b05-8029-08e2a65ebd16.png#averageHue=%23e7e9db&clientId=ube9b572d-c96f-4&from=paste&height=426&id=ue6c031a0&originHeight=479&originWidth=780&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=154879&status=done&style=none&taskId=u91626dc2-c052-4b4b-8e32-b0d2f7d5a11&title=&width=694)
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705885458459-0ad95d9d-7c8b-4967-83c6-9cb6cd81f212.png#averageHue=%23fdfcfb&clientId=ube9b572d-c96f-4&from=paste&height=315&id=u24af8131&originHeight=476&originWidth=1064&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=76895&status=done&style=none&taskId=u6d50645b-0193-44eb-80f2-821a9bf39c9&title=&width=703.4000244140625)
## 感知器
[深度学习实战教程(一)：感知器](https://cuijiahua.com/blog/2018/10/dl-7.html)
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705885517841-b31ab4f6-d926-4452-8a24-c33c42b39972.png#averageHue=%23f8f8f8&clientId=ube9b572d-c96f-4&from=paste&height=501&id=u22b99917&originHeight=626&originWidth=923&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=85799&status=done&style=none&taskId=ua733b5bb-3dae-408f-a62f-6a5da5f7ff8&title=&width=738.4)
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705885530150-4c155f39-601e-4558-bda5-6e434f4a13bc.png#averageHue=%23fbfbfb&clientId=ube9b572d-c96f-4&from=paste&height=269&id=u822cbf83&originHeight=336&originWidth=908&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=30255&status=done&style=none&taskId=u7a69f54f-ec8a-4c44-8490-a6938727c3f&title=&width=726.4)![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705885539727-e65279fc-9327-4d26-b15c-1ae3c74cb3c0.png#averageHue=%23f8f8f8&clientId=ube9b572d-c96f-4&from=paste&height=291&id=u0dc41eac&originHeight=364&originWidth=958&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=47192&status=done&style=none&taskId=u073e22db-bf9e-4eac-b244-ebc1bd5ac43&title=&width=766.4)
## 例子：用感知器（perceptron）实现and函数
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705885586338-3455cca9-4a2a-4f51-8987-4226700f73be.png#averageHue=%23f9f9f9&clientId=ube9b572d-c96f-4&from=paste&height=438&id=udca5c468&originHeight=548&originWidth=968&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=55148&status=done&style=none&taskId=u687044bb-eeda-46da-a586-14e5cc2d31a&title=&width=774.4)![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705885611705-a7c9313b-4edd-499a-b069-848439c600ec.png#averageHue=%23f8f8f8&clientId=ube9b572d-c96f-4&from=paste&height=293&id=u1d7d47f3&originHeight=366&originWidth=973&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=57203&status=done&style=none&taskId=ubec2f5dd-479a-4a98-b0fc-6498327f98a&title=&width=778.4)
## 例子 用感知器实现or函数
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705893516053-f1fb9430-8093-4bf0-964f-faaf76cd5adb.png#averageHue=%23f9f9f9&clientId=ube9b572d-c96f-4&from=paste&height=503&id=ue4da3519&originHeight=629&originWidth=946&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=73451&status=done&style=none&taskId=u5ddf7f18-925a-4e86-91a8-dda2c9cf384&title=&width=756.8)
## 感知器可以解决线性分类、线性回归问题
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705893554231-c0f973bb-b8d6-4799-a980-c50c72ea82b2.png#averageHue=%23f4f4f4&clientId=ube9b572d-c96f-4&from=paste&height=470&id=u5fa5b167&originHeight=587&originWidth=941&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=76080&status=done&style=none&taskId=u849f0523-1178-4ab3-9b7c-cceadb0c40f&title=&width=752.8)
## 无法解决异或运算
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705893595126-8e5d3cf5-4ceb-40dc-a1cb-95b90d4a647a.png#averageHue=%23f7f7f7&clientId=ube9b572d-c96f-4&from=paste&height=391&id=u313376d0&originHeight=489&originWidth=953&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=38410&status=done&style=none&taskId=u30a33b68-9050-4aea-bded-369010199f4&title=&width=762.4)
## 感知器的训练 （感知器规则）：求权值和偏置项
初始化为0

![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705893657518-e73c14ed-74c9-4b7b-b476-8c029119cfe6.png#averageHue=%23f3f3f3&clientId=ube9b572d-c96f-4&from=paste&height=498&id=u293206de&originHeight=622&originWidth=966&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=97572&status=done&style=none&taskId=u9f94bc13-28e8-4265-8f71-aac7fd3fc46&title=&width=772.8)
## python实现感知器
### 感知器类的实现
```python
from functools import reduce

'''
感知器（perceptron）
'''
class Perceptron():
    def __init__(self, input_num, activator):
        '''
        初始化感知器，设置输入参数的个数，以及激活函数。
        激活函数的类型为double -> double
        '''
        self.activator = activator
        # 权重向量初始化为0
        self.weights = [0.0 for _ in range(input_num)]
        # 偏置项初始化为0
        self.bias = 0.0
    def __str__(self):
        '''
        打印学习到的权重、偏置项
        '''
        return 'weights\t:%s\nbias\t:%f\n' % (self.weights, self.bias)
    def predict(self, input_vec):
        '''
        输入向量，输出感知器的计算结果
        '''
        # 把input_vec[x1,x2,x3...]和weights[w1,w2,w3,...]打包在一起
        # 变成[(x1,w1),(x2,w2),(x3,w3),...]
        # 然后利用map函数计算[x1*w1, x2*w2, x3*w3]
        # 最后利用reduce求和
        return self.activator(
            reduce(lambda a, b: a + b,list(map(lambda x, w: x * w, input_vec, self.weights)), 0.0) + self.bias)
    def train(self, input_vecs, labels, iteration, rate):
        '''
        输入训练数据：一组向量、与每个向量对应的label；以及训练轮数、学习率
        '''
        for i in range(iteration):
            self._one_iteration(input_vecs, labels, rate)
    def _one_iteration(self, input_vecs, labels, rate):
        '''
        一次迭代，把所有的训练数据过一遍
        '''
        # 把输入和输出打包在一起，成为样本的列表[(input_vec, label), ...]
        # 而每个训练样本是(input_vec, label)
        samples = zip(input_vecs, labels)
        # 对每个样本，按照感知器规则更新权重
        for (input_vec, label) in samples:
            # 计算感知器在当前权重下的输出
            output = self.predict(input_vec)
            # 更新权重
            self._update_weights(input_vec, output, label, rate)
    def _update_weights(self, input_vec, output, label, rate):
        '''
        按照感知器规则更新权重
        '''
        # 把input_vec[x1,x2,x3,...]和weights[w1,w2,w3,...]打包在一起
        # 变成[(x1,w1),(x2,w2),(x3,w3),...]
        # 然后利用感知器规则更新权重
        delta = label - output
        self.weights = list(map(lambda x, w: w + rate * delta * x, input_vec, self.weights))
        # 更新bias
        self.bias += rate * delta
```
#### lambda

- lambda 函数的语法只包含一个语句，表现形式如下：
lambda [arg1 [,arg2,.....argn]]:expression
- **lambda 函数是匿名的：**
所谓匿名函数，通俗地说就是没有名字的函数。lambda函数没有名字。
- **lambda 函数有输入和输出：**
输入是传入到参数列表argument_list的值，输出是根据表达式expression计算得到的值。
- **lambda 函数拥有自己的命名空间：**
不能访问自己参数列表之外或全局命名空间里的参数，只能完成非常简单的功能。
```python
lambda x, y: x*y			# 函数输入是x和y，输出是它们的积x*y
lambda:None					# 函数没有输入参数，输出是None
lambda *args: sum(args)		# 输入是任意个数参数，输出是它们的和(隐性要求输入参数必须能进行算术运算)
lambda **kwargs: 1			# 输入是任意键值对参数，输出是1
```
#### map()函数
**map() 函数：**
**描述：**
map() 会根据提供的函数对指定序列做映射。
第一个参数 function 以参数序列中的每一个元素调用 function 函数，返回包含每次 function 函数返回值的新列表。
**语法：**
map(function, iterable, ...)
**参数：**
function ----> 函数
iterable ----> 一个或多个序列
**返回值：**
Python 2.x 版本返回的是列表
Python 3.x 版本返回的是迭代器
**示例：**
```python
# ===========一般写法：===========
# 1、计算平方数
def square(x):
	return x ** 2

map(square, [1,2,3,4,5])	# 计算列表各个元素的平方
# 结果：
[1, 4, 9, 16, 25]

# ===========匿名函数写法：============
# 2、计算平方数，lambda 写法
map(lambda x: x ** 2, [1, 2, 3, 4, 5])
# 结果：
[1, 4, 9, 16, 25]	 

# 3、提供两个列表，将其相同索引位置的列表元素进行相加
map(lambda x, y: x + y, [1, 3, 5, 7, 9], [2, 4, 6, 8, 10])
# 结果：
[3, 7, 11, 15, 19]
```

 

#### python reduce()函数
[一文读懂reduce函数](https://zhuanlan.zhihu.com/p/122461275)
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705902528103-6bbeb0aa-8dc3-4760-b96f-7fcdf44e85ae.png#averageHue=%23f1f2e8&clientId=u4a8d7edf-090e-4&from=paste&height=327&id=u7b3c6ab4&originHeight=409&originWidth=1049&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=56392&status=done&style=none&taskId=u60310de7-acc8-4dd3-bedd-a6cb346b6c8&title=&width=839.2)
**语法**
reduce() 函数语法：
`reduce(function, iterable[, initializer])`
**参数**

- function -- 函数，有两个参数
- iterable -- 可迭代对象
- initializer -- 可选，初始参数  **（初始值就是第一次计算是初始值和第一个元素计算。）**

**返回值**
返回函数计算结果。
**实例**
以下实例展示了 reduce() 的使用方法：
```python
#!/usr/bin/python
# -*- coding: UTF-8 -*-

def add(x, y) :            # 两数相加
 return x + y
sum1 = reduce(add, [1,2,3,4,5])   # 计算列表和：1+2+3+4+5
sum2 = reduce(lambda x, y: x+y, [1,2,3,4,5])  # 使用 lambda 匿名函数
print(sum1)
print(sum2)
```
```python
#!/usr/bin/python
from functools import reduce

def add(x, y) :            # 两数相加
 return x + y
sum1 = reduce(add, [1,2,3,4,5])   # 计算列表和：1+2+3+4+5
sum2 = reduce(lambda x, y: x+y, [1,2,3,4,5])  # 使用 lambda 匿名函数
print(sum1)
print(sum2)
```
以上实例输出结果为：
```
15
15
```

#### zip()函数
**描述**
**zip()** 函数用于将可迭代的对象作为参数，将对象中对应的元素打包成一个个元组，然后返回由这些元组组成的对象，这样做的好处是节约了不少的内存。
我们可以使用 list() 转换来输出列表。
如果各个迭代器的元素个数不一致，则返回列表长度与最短的对象相同，利用 ***** 号操作符，可以将元组解压为列表。
_zip 方法在 Python 2 和 Python 3 中的不同：在 Python 2.x zip() 返回的是一个列表。_
_如果需要了解 Python2 的应用，可以参考 _[Python zip()](https://www.runoob.com/python/python-func-zip.html)_。_
**语法**
zip 语法：
zip([iterable, ...])
参数说明：

- iterable -- 一个或多个迭代器;

**返回值**
返回一个对象。
**实例**
以下实例展示了 zip 的使用方法：
```python
>>> a = [1,2,3]
>>> b = [4,5,6]
>>> c = [4,5,6,7,8]
>>> zipped = zip(a,b)     # 返回一个对象
>>> zipped
<zip object at 0x103abc288>
>>> list(zipped)  # list() 转换为列表
[(1, 4), (2, 5), (3, 6)]
>>> list(zip(a,c))              # 元素个数与最短的列表一致
[(1, 4), (2, 5), (3, 6)]

>>> a1, a2 = zip(*zip(a,b))          # 与 zip 相反，zip(*) 可理解为解压，返回二维矩阵式
>>> list(a1)
[1, 2, 3]
>>> list(a2)
[4, 5, 6]
>>>
```

### 利用上述感知器实现and函数
```python
def f(x):
    '''
    定义激活函数f
    '''
    return 1 if x > 0 else 0
def get_training_dataset():
    '''
    基于and真值表构建训练数据
    '''
    # 构建训练数据
    # 输入向量列表
    input_vecs = [[1,1], [0,0], [1,0], [0,1]]
    # 期望的输出列表，注意要与输入一一对应
    # [1,1] -> 1, [0,0] -> 0, [1,0] -> 0, [0,1] -> 0
    labels = [1, 0, 0, 0]
    return input_vecs, labels    
def train_and_perceptron():
    '''
    使用and真值表训练感知器
    '''
    # 创建感知器，输入参数个数为2（因为and是二元函数），激活函数为f
    p = Perceptron(2, f)
    # 训练，迭代10轮, 学习速率为0.1
    input_vecs, labels = get_training_dataset()
    p.train(input_vecs, labels, 10, 0.1)
    #返回训练好的感知器
    return p
if __name__ == '__main__': 
    # 训练and感知器
    and_perception = train_and_perceptron()
    # 打印训练获得的权重
    print(and_perception)
    # 测试
    print('1 and 1 = %d' % and_perception.predict([1, 1]))
    print('0 and 0 = %d' % and_perception.predict([0, 0]))
    print('1 and 0 = %d' % and_perception.predict([1, 0]))
    print('0 and 1 = %d' % and_perception.predict([0, 1]))
```
# 线性单元与梯度下降
[深度学习实战教程(二)：线性单元和梯度下降](https://cuijiahua.com/blog/2018/11/dl-8.html)
你应该还记得用来训练感知器的**『感知器规则』**。然而，我们并没有关心**这个规则是怎么得到的**。本文通过介绍另外一种『感知器』，也就是『线性单元』，来说明关于机器学习一些基本的概念，比如模型、目标函数、优化算法等等。这些概念对于所有的机器学习算法来说都是通用的，掌握了这些概念，就掌握了机器学习的基本套路。
## 线性单元是什么
感知器有一个问题，当面对的数据集不是**线性可分**的时候，**『感知器规则』可能无法收敛**，这意味着我们永远也无法完成一个感知器的训练。
为了解决这个问题，我们使用一个**可导**的**线性函数**来替代感知器的**阶跃函数**，这种感知器就叫做**线性单元**。线性单元在面对**线性不可分的数据集时**，会收敛到一个最佳的近似上。
为了简单起见，我们可以设置线性单元的激活函数f为
f(x)=x
这样的线性单元如下图所示
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705907863848-d568807d-7032-41e6-bc67-9af2cfd4c6b9.png#averageHue=%23eeeeed&clientId=u4a8d7edf-090e-4&from=paste&height=216&id=ue6ac248d&originHeight=192&originWidth=568&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=uf9e58489-1bd7-484a-af2d-c866d4aa294&title=&width=639)
对比此前我们讲过的感知器
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705907922936-aa92b7eb-d017-486c-816a-0f390c4b23a6.png#averageHue=%23000000&clientId=u4a8d7edf-090e-4&from=paste&height=364&id=u99dac1ac&originHeight=262&originWidth=397&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=u32e95ce0-f1cc-4c00-83c6-3b76727192f&title=&width=551)
这样替换了激活函数之后，**线性单元**将返回一个**实数值**而不是**0,1分类**。因此线性单元用来解决**回归**问题而不是**分类**问题。
## 线性单元的模型
当我们说**模型**时，我们实际上在谈论根据**输入x预测输出y的算法**。比如，x可以是一个人的工作年限，y可以是他的月薪，我们可以用某种算法来根据一个人的工作年限来预测他的收入。比如y：
y=h(x)=w∗x+b
函数h(x)叫做**假设**，而w、b是它的**参数**。我们假设参数w=1000，参数b=500，如果一个人的工作年限是5年的话，我们的模型会预测他的月薪为
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705908094755-ae8195bf-ad8a-40ef-896b-4523c781dbb9.png#averageHue=%23f9f9f9&clientId=u4a8d7edf-090e-4&from=paste&height=48&id=ubc8e1135&originHeight=60&originWidth=927&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=5427&status=done&style=none&taskId=u80275adb-b58f-4a80-8e46-26b02d0d1f4&title=&width=741.6)
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705908138465-7a19d56f-2086-4458-9d07-d33b4b1dfd6d.png#averageHue=%23f0f0f0&clientId=u4a8d7edf-090e-4&from=paste&height=275&id=ue9eee25b&originHeight=344&originWidth=961&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=56368&status=done&style=none&taskId=u1af77c2b-5d9e-439c-80fc-9d891769f4d&title=&width=768.8)
### 为了书写计算方便，令w0等于b。
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705908168017-03a013d6-546a-4cac-8510-1b44ddc6f793.png#averageHue=%23f6f6f6&clientId=u4a8d7edf-090e-4&from=paste&height=336&id=u1ac642b8&originHeight=420&originWidth=963&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=47899&status=done&style=none&taskId=u5b4b5843-bd0c-41cd-b46c-3085acfa7df&title=&width=770.4)
## 监督学习与无监督学习（有没有对应输出label）
接下来，我们需要关心的是这个模型如何训练，也就是参数w取什么值最合适。
机器学习有一类学习方法叫做**监督学习**，它是说为了训练一个模型，我们要提供这样一堆训练样本：每个训练样本既包括输入特征x，也包括对应的输出y(y也叫做**标记，label**)。
也就是说，我们要找到很多人，我们既知道他们的特征(工作年限，行业...)，也知道他们的收入。我们用这样的样本去训练模型，让模型既看到我们提出的每个问题(输入特征x)，也看到对应问题的答案(标记y)。当模型看到足够多的样本之后，它就能总结出其中的一些规律。然后，就可以预测那些它没看过的输入所对应的答案了。
另外一类学习方法叫做**无监督学习**，这种方法的训练样本中只有x而没有y。模型可以总结出特征x的一些规律，但是无法知道其对应的答案y。
很多时候，既有x又有y的训练样本是很少的，大部分样本都只有x。比如在语音到文本(STT)的识别任务中，x是语音，y是这段语音对应的文本。我们很容易获取大量的语音录音，然而把语音一段一段切分好并**标注**上对应文字则是非常费力气的事情。这种情况下，为了弥补带标注样本的不足，我们可以用**无监督学习方法**先做一些**聚类**，让模型总结出哪些音节是相似的，然后再用少量的带标注的训练样本，告诉模型其中一些音节对应的文字。这样模型就可以把相似的音节都对应到相应文字上，完成模型的训练。
## 线性单元的目标函数
### 单个样本的误差 e
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705908535617-8c5849ca-e235-4b8e-8313-b1f8fcd692fc.png#averageHue=%23f2f2f2&clientId=u4a8d7edf-090e-4&from=paste&height=298&id=u8c041819&originHeight=372&originWidth=965&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=54752&status=done&style=none&taskId=u1559f479-a494-4cc0-abe4-616b1a75c57&title=&width=772)
### 模型的误差 E
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705908607993-b8a08374-eb21-4ae7-8221-afb72576d7eb.png#averageHue=%23f7f7f7&clientId=u4a8d7edf-090e-4&from=paste&height=561&id=u7509d6c9&originHeight=701&originWidth=953&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=75067&status=done&style=none&taskId=u8a4e39b2-e23e-4ecb-bd22-6aed9b47b85&title=&width=762.4)
### 优化问题，求合适的w，即权值
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705908671090-2646e343-c7ef-4fa3-88c0-7b36503076c6.png#averageHue=%23f4f4f4&clientId=u4a8d7edf-090e-4&from=paste&height=270&id=uc36d4c81&originHeight=338&originWidth=939&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=47110&status=done&style=none&taskId=uc024f421-f993-41c7-a263-a666f77058e&title=&width=751.2)
## 梯度下降优化算法
### 求函数的极值
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705908764005-d5ee800c-776e-4393-952c-de866d808ebd.png#averageHue=%23f8f8f8&clientId=u4a8d7edf-090e-4&from=paste&height=627&id=uede0adaa&originHeight=784&originWidth=944&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=121521&status=done&style=none&taskId=uab5f9153-d3fd-4f47-a964-6a20eaead31&title=&width=755.2)
### 梯度：函数值上升最快的方向
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705908813960-459a94dc-c1b3-41a1-a157-98f12d12de65.png#averageHue=%23e9e9e9&clientId=u4a8d7edf-090e-4&from=paste&height=285&id=uc7894fa4&originHeight=356&originWidth=937&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=73081&status=done&style=none&taskId=uab5563b9-478a-4b46-9c27-41540b83e3c&title=&width=749.6)
### 梯度下降算法的公式
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705908893706-7707a1f9-dc03-4783-9ce7-2ba9749558c8.png#averageHue=%23f5f5f5&clientId=u4a8d7edf-090e-4&from=paste&height=118&id=ud53f7af0&originHeight=147&originWidth=950&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=20120&status=done&style=none&taskId=uf2394964-bfff-4fb0-a11a-42a1fa1ef9b&title=&width=760)
### 求模型的最小误差E，用梯度下降
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705908957779-bb395f42-7f0b-4ec8-94db-40168812b048.png#averageHue=%23f8f8f8&clientId=u4a8d7edf-090e-4&from=paste&height=276&id=ud41108f8&originHeight=345&originWidth=942&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=34357&status=done&style=none&taskId=u760154d7-0335-4c46-b254-efe3794e7a7&title=&width=753.6)
### 求取E(w)的梯度算子
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705909049356-59fd3343-50f3-46b8-9930-29821a580a3e.png#averageHue=%23f3f3f3&clientId=u4a8d7edf-090e-4&from=paste&height=305&id=u42e8cc4c&originHeight=381&originWidth=930&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=54057&status=done&style=none&taskId=u55d25afe-bb53-491e-9cf3-78aaba26dff&title=&width=744)

![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705909138924-62dc4acd-cbab-45d5-b943-6b192fdcc34b.png#averageHue=%23f5f5f5&clientId=u4a8d7edf-090e-4&from=paste&height=398&id=u09cde5a7&originHeight=497&originWidth=935&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=62975&status=done&style=none&taskId=u6c741e34-a7a9-4edd-9fab-b9c258ed0c4&title=&width=748)
## E(w)梯度的推导
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705909206363-0416aebe-f132-432b-a57f-b710319306e1.png#averageHue=%23f6f6f6&clientId=u4a8d7edf-090e-4&from=paste&height=293&id=u323cc4b3&originHeight=366&originWidth=931&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=38673&status=done&style=none&taskId=u3683d86f-f030-48bb-91d2-f57a1620b75&title=&width=744.8)

![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705909293350-e4708d08-5aa7-4802-9e85-f483342e93de.png#averageHue=%23f7f7f7&clientId=u4a8d7edf-090e-4&from=paste&height=193&id=u7599c261&originHeight=241&originWidth=922&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=26800&status=done&style=none&taskId=uaa6d4a0e-d772-49b6-93c7-3adcfabe9ff&title=&width=737.6)
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705909329793-334de0c5-a688-4ea2-b4e9-49e702b52b69.png#averageHue=%23f8f8f8&clientId=u4a8d7edf-090e-4&from=paste&height=252&id=u30312421&originHeight=315&originWidth=945&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=35120&status=done&style=none&taskId=ubd8755c3-fc5b-4006-8a2f-6812740d6aa&title=&width=756)
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705909347509-3f924eb6-4633-4a63-b1c6-a69b822e9591.png#averageHue=%23fbfbfb&clientId=u4a8d7edf-090e-4&from=paste&height=626&id=uadc44452&originHeight=782&originWidth=940&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=62328&status=done&style=none&taskId=ua64ddb8c-a126-4b19-8c0e-fba947ecc70&title=&width=752)
## 随机梯度下降算法(Stochastic Gradient Descent, SGD)
如果我们根据**(式3**)来训练模型，那么我们每次更新w的迭代，要遍历训练数据中所有的样本进行计算，我们称这种算法叫做**批梯度下降(Batch Gradient Descent)**。
如果我们的样本非常大，比如数百万到数亿，那么计算量异常巨大。因此，实用的算法是SGD算法。
在SGD算法中，每次更新w的迭代，只计算一个样本。这样对于一个具有数百万样本的训练数据，完成一次遍历就会对w更新数百万次，效率大大提升。由于样本的噪音和随机性，每次更新w并不一定按照减少E的方向。然而，虽然存在一定随机性，大量的更新总体上沿着减少E的方向前进的，因此最后也能收敛到最小值附近。下图展示了SGD和BGD的区别
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705909616190-f1f34139-debf-4083-a696-633e130a5489.png#averageHue=%23f9f9f9&clientId=u4a8d7edf-090e-4&from=paste&height=46&id=ud7227c3d&originHeight=57&originWidth=952&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=7120&status=done&style=none&taskId=uff602872-56f0-49f3-b65e-6cea2833d15&title=&width=761.6)
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705909628248-febde600-0218-4883-b011-d28d19ff128b.png#averageHue=%23cdcfea&clientId=u4a8d7edf-090e-4&from=paste&height=343&id=u6c5dfcaf&originHeight=309&originWidth=388&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=udcd30e45-8b73-4927-ac4b-bbc5f1370bd&title=&width=431)
如上图，椭圆表示的是函数值的等高线，椭圆中心是函数的最小值点。红色是BGD的逼近曲线，而紫色是SGD的逼近曲线。我们可以看到BGD是一直向着最低点前进的，而SGD明显躁动了许多，但总体上仍然是向最低点逼近的。
最后需要说明的是，SGD不仅仅效率高，而且**随机性有时候反而是好事**。今天的目标函数是一个『凸函数』，沿着梯度反方向就能找到全局唯一的最小值。然而对于非凸函数来说，存在许多局部最小值。随机性有助于我们逃离某些很糟糕的局部最小值，从而获得一个更好的模型。

## python实现线性单元
完整代码请参考GitHub：[点击查看](https://github.com/Jack-Cherish/Deep-Learning/tree/master/Tutorial/lesson-2)
因为我们已经写了感知器的代码，因此我们先比较一下感知器模型和线性单元模型，看看哪些代码能够复用。
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705909795961-b01d017f-588e-4943-921c-e2b09cf1a8a9.png#averageHue=%23f4f5f2&clientId=u4a8d7edf-090e-4&from=paste&height=158&id=ud187692f&originHeight=179&originWidth=852&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=u84ffd32c-1a74-4585-9c7a-f4ebdcfb91d&title=&width=753.4000244140625)
比较的结果令人震惊，原来除了激活函数f不同之外，两者的模型和训练规则是一样的(在上表中，线性单元的优化算法是SGD算法)。那么，我们只需要把感知器的激活函数进行替换即可。感知器的代码请参考上一篇文章[深度学习实战教程(一) ：感知器](https://cuijiahua.com/blog/2018/10/dl-7.html)，这里就不再重复了。对于一个养成良好习惯的程序员来说，重复代码是不可忍受的。大家应该把代码保存在一个代码库中(比如git)。
将上一篇文章[深度学习实战教程(一) ：感知器](https://cuijiahua.com/blog/2018/10/dl-7.html)的代码保存到perceptron.py文件中，然后新创建一个linear_unit.py文件。
```python
from perceptron import Perceptron
#定义激活函数f
f = lambda x: x
class LinearUnit(Perceptron):
    def __init__(self, input_num):
        '''初始化线性单元，设置输入参数的个数'''
        Perceptron.__init__(self, input_num, f)
```
通过继承Perceptron，我们仅用几行代码就实现了线性单元。这再次证明了面向对象编程范式的强大。
接下来，我们用简单的数据进行一下测试。
```python
def get_training_dataset():
    '''
    捏造5个人的收入数据
    '''
    # 构建训练数据
    # 输入向量列表，每一项是工作年限
    input_vecs = [[5], [3], [8], [1.4], [10.1]]
    # 期望的输出列表，月薪，注意要与输入一一对应
    labels = [5500, 2300, 7600, 1800, 11400]
    return input_vecs, labels    
def train_linear_unit():
    '''
    使用数据训练线性单元
    '''
    # 创建感知器，输入参数的特征数为1（工作年限）
    lu = LinearUnit(1)
    # 训练，迭代10轮, 学习速率为0.01
    input_vecs, labels = get_training_dataset()
    lu.train(input_vecs, labels, 10, 0.01)
    #返回训练好的线性单元
    return lu
if __name__ == '__main__': 
    '''训练线性单元'''
    linear_unit = train_linear_unit()
    # 打印训练获得的权重
    print(linear_unit)
    # 测试
    print('Work 3.4 years, monthly salary = %.2f' % linear_unit.predict([3.4]))
    print('Work 15 years, monthly salary = %.2f' % linear_unit.predict([15]))
    print('Work 1.5 years, monthly salary = %.2f' % linear_unit.predict([1.5]))
    print('Work 6.3 years, monthly salary = %.2f' % linear_unit.predict([6.3]))

```
程序运行结果如下图
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705910046860-f519c21d-3acb-4ca7-af80-e01ee4aec6a4.png#averageHue=%232a2b24&clientId=u4a8d7edf-090e-4&from=paste&id=u07166ebd&originHeight=318&originWidth=912&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=u2e829081-f551-4e98-87da-59c89c8c1c1&title=)
拟合的直线如下图
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705910033503-ee76b8a7-a889-4520-8f2a-b851d3dbede0.png#averageHue=%23eeeeee&clientId=u4a8d7edf-090e-4&from=paste&id=u14f57859&originHeight=834&originWidth=1108&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=uda3aef62-4d59-480c-8d33-b59b8cce6ac&title=)
### python 继承
[【python】详解类class的继承、__init__初始化、super方法（五）_child’ object has no attribute ’open_video-CSDN博客](https://blog.csdn.net/brucewong0516/article/details/79121179)
**继承中的__ _init__ _**
**当在Python中出现继承的情况时，一定要注意初始化函数__init__的行为:**

- 如果**子类没有定义自己的初始化函数，父类的初始化函数会被默认调用**；但是**如果要实例化子类的对象，则只能传入父类的初始化函数对应的参数**，否则会出错。
- 如果子类定义了自己的初始化函数，而**在子类中没有显示调用父类的初始化函数，则父类的属性不会被初始化**
- 如果子类定义了自己的初始化函数，**在子类中显示调用父类，子类和父类的属性都会被初始化**
## 小结
事实上，一个机器学习算法其实只有两部分

- 模型从输入特征x预测输入y的那个函数h(x)
- _目标函数_ 目标函数取最小(最大)值时所对应的参数值，就是模型的参数的**最优值**。很多时候我们只能获得目标函数的**局部最小(最大)值**，因此也只能得到模型参数的**局部最优值**。

因此，如果你想最简洁的介绍一个算法，列出这两个函数就行了。
接下来，你会用**优化算法**去求取目标函数的最小(最大)值。**[随机]梯度{下降|上升}**算法就是一个**优化算法**。针对同一个**目标函数**，不同的**优化算法**会推导出不同的**训练规则**。我们后面还会讲其它的优化算法。
其实在机器学习中，算法往往并不是关键，真正的关键之处在于选取特征。选取特征需要我们人类对问题的深刻理解，经验、以及思考。而**神经网络算法的一个优势**，就在于它能够**自动学习到应该提取什么特征**，从而使算法不再那么依赖人类，而这也是神经网络之所以吸引人的一个方面。
现在，经过漫长的烧脑，你已经具备了学习**神经网络**的必备知识。下一篇文章，我们将介绍本系列文章的主角：**神经网络**，以及用来训练神经网络的大名鼎鼎的算法：**反向传播**算法。至于现在，我们应该暂时忘记一切，尽情奖励自己一下吧。

# 神经网络和反向传播算法
在上一篇文章中，我们已经掌握了机器学习的基本套路，对模型、目标函数、优化算法这些概念有了一定程度的理解，而且已经会训练单个的感知器或者线性单元了。
在这篇文章中，我们将把这些单独的单元按照一定的规则相互连接在一起形成**神经网络**，从而奇迹般的获得了强大的学习能力。我们还将介绍这种网络的训练算法：**反向传播算法**。最后，我们依然用代码实现一个神经网络。如果您能坚持到本文的结尾，将会看到我们用自己实现的神经网络去识别手写数字。现在请做好准备，您即将双手触及到深度学习的大门。
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706060805466-274bce27-4cc8-4da0-9d02-3552c8f9e934.png#averageHue=%23f7caac&clientId=u49e7a272-c142-4&from=paste&id=jxU63&originHeight=372&originWidth=878&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=uba385cfe-ab23-48fa-a58b-e5fa6515ba7&title=)
## 公式
### 公式（1） 计算节点的输出
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705998204364-3301e89f-c374-431e-a7cd-54f9675c26c3.png#averageHue=%23f9f9f9&clientId=u25a55d6b-4052-4&from=paste&height=494&id=u79f708d8&originHeight=617&originWidth=960&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=62730&status=done&style=none&taskId=u23a7f5ce-83a3-4f8e-813c-73e323f43b7&title=&width=768)
### 公式（2） 向量形式计算输出
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705998277091-92e8369f-f3ec-417a-9460-0b25dad91951.png#averageHue=%23f1f1f1&clientId=u25a55d6b-4052-4&from=paste&height=146&id=u8d556e30&originHeight=182&originWidth=1012&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=52886&status=done&style=none&taskId=u9ffc4124-ef41-4a91-bc40-ff8179cfe5c&title=&width=809.6)
### 公式（3） 计算输出层节点的误差项
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705924150493-6e1a9fdf-36cc-4462-89f6-6902170ccf47.png?x-oss-process=image%2Fresize%2Cw_917%2Climit_0#averageHue=%23f7f6f6&from=url&id=hiStB&originHeight=386&originWidth=917&originalType=binary&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&title=)
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705998317080-0672b4e7-7750-4528-a1d5-cb099fb7dd52.png#averageHue=%23f5f5f5&clientId=u25a55d6b-4052-4&from=paste&height=326&id=u3f845b04&originHeight=407&originWidth=971&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=79500&status=done&style=none&taskId=ub3a92eb5-0d22-4fe5-9575-55f6a2dd2d6&title=&width=776.8)
### 公式（4）计算隐藏层节点的误差项
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705998501628-8e67005c-fd4e-4afa-b6d5-f5f62ae32200.png#averageHue=%23f7f7f7&clientId=u25a55d6b-4052-4&from=paste&height=188&id=uc231264f&originHeight=235&originWidth=978&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=44496&status=done&style=none&taskId=u76cac019-559e-4ba6-8c4a-8717d671a78&title=&width=782.4)
### 公式（5） 更新连接上的权值
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705998558770-56177dc4-8a2e-4bcc-8b4c-8e4d89c80128.png#averageHue=%23f8f8f8&clientId=u25a55d6b-4052-4&from=paste&height=376&id=u9cc899a4&originHeight=470&originWidth=991&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=77131&status=done&style=none&taskId=u60d24c92-4a4b-4516-b60d-729f9b99cb6&title=&width=792.8)
## 神经元
**神经元和感知器本质上是一样的**，只不过我们说感知器的时候，它的激活函数是**阶跃函数**；而当我们说神经元时，激活函数往往选择为**sigmoid函数或tanh函数**。如下图所示：
![](https://cdn.nlark.com/yuque/0/2024/gif/40625813/1705922943332-eea19973-452b-4f15-b1e2-30aef5a63c16.gif#averageHue=%23f7f7f7&clientId=u2f171321-6140-4&from=paste&height=195&id=uf4eb965c&originHeight=177&originWidth=503&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=u43fa2924-9343-4485-b106-b68df1132bd&title=&width=553)
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705923086480-57cd32ad-0467-4604-959b-be25cc6768dc.png#averageHue=%23f8f8f8&clientId=u2f171321-6140-4&from=paste&height=287&id=u7a5cf4d1&originHeight=359&originWidth=925&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=34225&status=done&style=none&taskId=ub4aae8d7-42a6-44cd-ae73-49390ee6da1&title=&width=740)
sigmoid函数是一个非线性函数，值域是(0,1)。函数图像如下图所示
![](https://cdn.nlark.com/yuque/0/2024/jpeg/40625813/1705923100280-13462b5e-25cd-4c29-813e-a5db024cc5a7.jpeg#averageHue=%23f3f3f3&clientId=u2f171321-6140-4&from=paste&id=ubec3d644&originHeight=240&originWidth=300&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=uf09eddcb-9d2f-49e5-a8aa-c8f676c6b99&title=)
sigmoid函数的导数是：
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705923131467-cc53b2be-5bc8-45ba-81f8-c70fc9d3bf45.png#averageHue=%23fbfbfb&clientId=u2f171321-6140-4&from=paste&height=61&id=u83ce6ce7&originHeight=76&originWidth=919&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=6936&status=done&style=none&taskId=ueec8feae-c264-45f2-beb1-4dbb41994e3&title=&width=735.2)
可以看到，sigmoid函数的导数非常有趣，它可以用sigmoid函数自身来表示。这样，一旦计算出sigmoid函数的值，计算它的导数的值就非常方便。
## 神经网络是啥
![](https://cdn.nlark.com/yuque/0/2024/jpeg/40625813/1705923182188-495d3273-e686-4efe-bede-9ae6347f4308.jpeg#averageHue=%23dfe7d9&clientId=u2f171321-6140-4&from=paste&id=udafa40be&originHeight=350&originWidth=511&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=ud53f4307-4abe-46af-8b0d-151536f07ee&title=)
**神经网络**其实就是按照**一定规则**连接起来的**多个神经元**。上图展示了一个**全连接(full connected, FC)**神经网络，通过观察上面的图，我们可以发现它的规则包括：

- 神经元按照**层**来布局。最左边的层叫做**输入层**，负责接收输入数据；最右边的层叫**输出层**，我们可以从这层获取神经网络输出数据。输入层和输出层之间的层叫做**隐藏层**，因为它们对于外部来说是不可见的。
- **同一层**的神经元之间**没有连接**。
- 第N层的每个神经元和第N-1层的**所有**神经元相连(这就是full connected的含义)，第N-1层神经元的输出就是第N层神经元的输入。
- 每个连接都有一个**权值**。

上面这些规则定义了**全连接神经网络的结构**。事实上还存在很多其它结构的神经网络，比如卷积神经网络(CNN)、循环神经网络(RNN)，他们都具有不同的连接规则。
## 神经网络的输出
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705923273762-512220fa-012c-4552-958f-3371a4ae2824.png#averageHue=%23efefef&clientId=u2f171321-6140-4&from=paste&height=174&id=u4df860d9&originHeight=217&originWidth=947&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=34606&status=done&style=none&taskId=u4f9309c4-f0a1-410a-8263-08c56fe8659&title=&width=757.6)
### 例子
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705923317847-f478550e-1aea-4d33-93b6-3c85c937443c.png#averageHue=%23f3f3f3&clientId=uaba10839-7aa6-4&from=paste&height=442&id=u5b4b160a&originHeight=553&originWidth=951&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=230632&status=done&style=none&taskId=u3365831e-dc0d-45f2-a89d-98e0fad1128&title=&width=760.8)
#### 求出节点4的输出值a4
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705923468312-09d1e7dc-f0fc-45ca-a3b4-e4e61c7b2998.png#averageHue=%23ededed&clientId=uaba10839-7aa6-4&from=paste&height=326&id=ua73176b5&originHeight=408&originWidth=959&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=78791&status=done&style=none&taskId=u6d6d7024-a6cb-4af6-aba2-ab102969630&title=&width=767.2)
#### 计算出a5,a6,a7...y1,y2
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705923547289-b0317d06-01aa-4447-b4e4-1507d3e6b36f.png#averageHue=%23f2f2f2&clientId=uaba10839-7aa6-4&from=paste&height=270&id=u77c8a561&originHeight=338&originWidth=945&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=52931&status=done&style=none&taskId=u550f9660-fb33-4aa2-8914-89f3e2fb86e&title=&width=756)
### 神经网络的矩阵表示
神经网络的计算如果用矩阵来表示会很方便（当然逼格也更高），我们先来看看隐藏层的矩阵表示。
首先我们把隐藏层4个节点的计算依次排列出来：
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705923723551-61b32d1a-cac5-4878-bfbe-a9a849b6c941.png#averageHue=%23fefefe&clientId=uaba10839-7aa6-4&from=paste&height=122&id=ubc9b311c&originHeight=153&originWidth=904&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=45376&status=done&style=none&taskId=uac3bb2f6-9315-4f25-93f9-2f3b07d036c&title=&width=723.2)
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705923744645-54ac0d6a-5410-471c-8bb0-c0c03e7b48c6.png#averageHue=%23fdfdfd&clientId=uaba10839-7aa6-4&from=paste&height=286&id=u2019dc04&originHeight=358&originWidth=894&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=50110&status=done&style=none&taskId=u62f1c989-fd7a-43c6-8280-5cbeb7be64b&title=&width=715.2)![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705923763209-4ffc5ef6-8de6-46bd-a199-987b6e7c16d3.png#averageHue=%23fdfdfd&clientId=uaba10839-7aa6-4&from=paste&height=180&id=u2fb74d70&originHeight=225&originWidth=904&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=25139&status=done&style=none&taskId=u5e3a26a6-e190-4be6-9883-8f36d603291&title=&width=723.2)![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705923790881-9f9b5a85-dbf2-49d9-a6a4-03fc6750716d.png#averageHue=%23f7f7f7&clientId=uaba10839-7aa6-4&from=paste&height=427&id=u636432ad&originHeight=534&originWidth=947&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=97761&status=done&style=none&taskId=u197526be-70b0-4fb1-b3df-c251d4fe521&title=&width=757.6)
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705923868690-734b4333-450b-4c37-95bf-fcabb2c36b55.png#averageHue=%23e8e8e8&clientId=uaba10839-7aa6-4&from=paste&height=368&id=u11e985c8&originHeight=460&originWidth=943&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=156454&status=done&style=none&taskId=u907ecbfe-70e2-43ab-9373-2b9e308867e&title=&width=754.4)
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705923925598-ea3e1faa-9f94-418c-86e4-3feaed45e688.png#averageHue=%23fbfbfb&clientId=uaba10839-7aa6-4&from=paste&height=190&id=uadc00e50&originHeight=238&originWidth=932&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=31113&status=done&style=none&taskId=u7e8cfb0b-f305-4cde-9afa-cde90de8925&title=&width=745.6)
## 神经网络的训练（求权值）反向传播算法
现在，我们需要知道一个神经网络的每个连接上的权值是如何得到的。我们可以说神经网络是一个**模型**，那么这些权值就是模型的**参数**，也就是模型要学习的东西。然而，一个神经网络的连接方式、网络的层数、每层的节点数这些参数，则不是学习出来的，而是人为事先设置的。对于**这些人为设置的参数**，我们称之为**超参数(Hyper-Parameters)**。
接下来，我们将要介绍神经网络的训练算法：反向传播算法。
### 反向传播算法(Back Propagation)
我们首先直观的介绍反向传播算法，最后再来介绍这个算法的推导。当然读者也可以完全跳过推导部分，因为即使不知道如何推导，也不影响你写出来一个神经网络的训练代码。事实上，现在神经网络成熟的开源实现多如牛毛，除了练手之外，你可能都没有机会需要去写一个神经网络。
我们以**监督学习**为例来解释反向传播算法。在[深度学习实战教程(二)：线性单元和梯度下降](https://cuijiahua.com/blog/2018/11/dl-8.html)一文中我们介绍了什么是**监督学习**，如果忘记了可以再看一下。另外，我们设神经元的激活函数f为sgmoid函数(不同激活函数的计算公式不同，详情见[反向传播算法的推导](https://cuijiahua.com/blog/2018/11/dl-9.html#%E7%A5%9E%E7%BB%8F%E5%85%83))。
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705924150493-6e1a9fdf-36cc-4462-89f6-6902170ccf47.png#averageHue=%23f7f6f6&clientId=uaba10839-7aa6-4&from=paste&height=309&id=uf70c5f20&originHeight=386&originWidth=917&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=199925&status=done&style=none&taskId=ue4c323fc-9fbb-498c-8de2-bb7602aaede&title=&width=733.6)
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705924184329-8833815c-9320-4912-953d-7e7e25b31778.png#averageHue=%23f1f1f1&clientId=uaba10839-7aa6-4&from=paste&height=64&id=u3c34353e&originHeight=80&originWidth=938&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=11648&status=done&style=none&taskId=ue83ba72c-839b-4c42-939d-77d2cdcfba8&title=&width=750.4)![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705924204394-89bdc843-3b81-4d20-b377-1b7e62823f30.png#averageHue=%23f5f5f5&clientId=uaba10839-7aa6-4&from=paste&height=259&id=u60610ecc&originHeight=324&originWidth=940&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=39738&status=done&style=none&taskId=ua4e619a5-b120-41d6-8525-bc6bd5ee7f1&title=&width=752)![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705924246878-fb304a8e-4283-474a-8c3d-3dda7d2256cb.png#averageHue=%23f6f6f6&clientId=uaba10839-7aa6-4&from=paste&height=182&id=u61811d06&originHeight=227&originWidth=940&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=28458&status=done&style=none&taskId=ub4a8cf94-cd08-432f-b09c-4e7d255e492&title=&width=752)
最后，更新每个连接上的权值：
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705924341653-8ddd9c75-7e22-4e75-a2a9-73a8225a47a0.png#averageHue=%23f7f7f7&clientId=uaba10839-7aa6-4&from=paste&height=329&id=u873892b8&originHeight=411&originWidth=935&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=44804&status=done&style=none&taskId=u70eeb349-96a4-4863-aa40-2d538ac1d7e&title=&width=748)
我们已经介绍了神经网络每个节点误差项的计算和权重更新方法。
显然，计算一个节点的误差项，需要先计算每个与其相连的下一层节点的误差项。这就要求**误差项的计算顺序必须是从输出层开始**，然后**反向**依次计算每个隐藏层的误差项，直到与输入层相连的那个隐藏层。这就是反向传播算法的名字的含义。当所有节点的误差项计算完毕后，我们就可以根据**式5**来更新所有的权重。
以上就是基本的反向传播算法，并不是很复杂，您弄清楚了么？
### 反向传播算法的推导
反向传播算法其实就是**链式求导法则**的应用。然而，这个如此简单且显而易见的方法，却是在Roseblatt提出感知器算法将近30年之后才被发明和普及的。对此，Bengio这样回应道：
很多看似显而易见的想法只有在事后才变得显而易见。
接下来，我们用链式求导法则来推导反向传播算法，也就是上一小节的**式3**、**式4**、**式5**。
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705924470773-1f14c1f5-ae41-4538-ac16-197a7365e948.png#averageHue=%23fafafa&clientId=uaba10839-7aa6-4&from=paste&height=40&id=u03f63c13&originHeight=50&originWidth=892&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=5250&status=done&style=none&taskId=u2595a582-f29d-4bbf-8503-6aca81b399d&title=&width=713.6)![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705924478532-a7436a1c-2c8c-425e-987e-ddb752b09a32.png#averageHue=%23f9f9f9&clientId=uaba10839-7aa6-4&from=paste&height=45&id=u04cb31aa&originHeight=56&originWidth=900&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=6421&status=done&style=none&taskId=u5ece6d78-37f1-40ae-96d8-1600619c67e&title=&width=720)![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705924482193-f179ef17-88ea-4832-80f9-81a3ba36fbbd.png#averageHue=%23fbfbfb&clientId=uaba10839-7aa6-4&from=paste&height=46&id=uef87a35e&originHeight=57&originWidth=885&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=4773&status=done&style=none&taskId=u47e489ad-75fb-41d7-8753-2521af4be1d&title=&width=708)
**前方高能预警——接下来是数学公式重灾区，读者可以酌情阅读，不必强求。**
按照机器学习的通用套路，我们先确定神经网络的目标函数，然后用**随机梯度下降**优化算法去求目标函数最小值时的参数值。
我们取网络所有输出层节点的**误差平方和作为目标函数**：
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705924528903-e2ea8e50-5fe0-4417-a501-cae37490f377.png#averageHue=%23fafafa&clientId=uaba10839-7aa6-4&from=paste&height=82&id=u61896acc&originHeight=102&originWidth=891&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=9186&status=done&style=none&taskId=u32437de0-de08-4ebd-9a2d-db1d0bc64cb&title=&width=712.8)
然后，我们用文章[深度学习实战教程(二)：线性单元和梯度下降](https://cuijiahua.com/blog/2018/11/dl-8.html)中介绍的**随机梯度下降**算法对目标函数进行优化：
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705924565484-232b28f2-7de2-43f3-aba2-358f2f83c6ea.png#averageHue=%23fcfcfc&clientId=uaba10839-7aa6-4&from=paste&height=55&id=u5854ee58&originHeight=69&originWidth=865&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=4356&status=done&style=none&taskId=u8c7ccf88-ca0b-45ef-b07e-8726edf2ee2&title=&width=692)
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705924584328-9fa815b2-e654-41ed-9d5a-75f6aa5e4825.png#averageHue=%23f6f5f5&clientId=uaba10839-7aa6-4&from=paste&height=295&id=u9ed072f4&originHeight=369&originWidth=903&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=198990&status=done&style=none&taskId=u280bbda4-cfd6-491f-a216-5ce94bb12cb&title=&width=722.4)
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705924811713-586a9dcb-8a47-497f-82b1-8b7c17953c56.png#averageHue=%23f9f9f9&clientId=uaba10839-7aa6-4&from=paste&height=156&id=u2295ca96&originHeight=195&originWidth=950&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=25078&status=done&style=none&taskId=u2d74a14b-1db9-4103-b539-7e02c251a9e&title=&width=760)![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705924827187-a456876a-6cf5-4fb1-aa75-66518ac81469.png#averageHue=%23fbfbfb&clientId=uaba10839-7aa6-4&from=paste&height=258&id=u4ad5b7b6&originHeight=323&originWidth=902&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=48325&status=done&style=none&taskId=u6a1f767e-cdac-47a0-a489-46b0bf44e35&title=&width=721.6)![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705924839733-3d5380bf-a9aa-4304-9b70-0c33dc357d2b.png#averageHue=%23fafafa&clientId=uaba10839-7aa6-4&from=paste&height=561&id=uea9d63ca&originHeight=701&originWidth=945&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=97436&status=done&style=none&taskId=u4d2f7f31-47b0-4272-9334-1dfa4972f40&title=&width=756)![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705924854907-ec7a58e1-c204-4de8-9bc3-b2f4a68469be.png#averageHue=%23fbfbfb&clientId=uaba10839-7aa6-4&from=paste&height=490&id=u036d0178&originHeight=613&originWidth=941&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=69108&status=done&style=none&taskId=u39664a01-f5a3-4cd6-b93e-0be3fecfdff&title=&width=752.8)![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705924870339-6eb9738a-d422-47c9-925f-add1caa6c827.png#averageHue=%23fafafa&clientId=uaba10839-7aa6-4&from=paste&height=586&id=u220f599f&originHeight=732&originWidth=955&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=129024&status=done&style=none&taskId=u14172929-f567-4016-bccb-c59fd42f2f4&title=&width=764)![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705924886134-fef2a88b-03a4-4c9b-8256-477d0dff1a03.png#averageHue=%23fcfcfc&clientId=uaba10839-7aa6-4&from=paste&height=150&id=ufb1d09e3&originHeight=187&originWidth=944&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=21023&status=done&style=none&taskId=u6a3dc16e-53e2-4353-9587-4dbcab743e6&title=&width=755.2)**	——数学公式警报解除——**
至此，我们已经推导出了反向传播算法。需要注意的是，我们刚刚推导出的训练规则是根据激活函数是sigmoid函数、平方和误差、全连接网络、随机梯度下降优化算法。**如果激活函数不同、误差计算方式不同、网络连接结构不同、优化算法不同，则具体的训练规则也会不一样。**但是无论怎样，训练规则的推导方式都是一样的，应用链式求导法则进行推导即可。

## 神经网络的实现python（基本的全连接神经系统）
完整代码请参考GitHub：[点击查看](https://github.com/Jack-Cherish/Deep-Learning/blob/master/Tutorial/lesson-3/bp.py)
现在，我们要根据前面的算法，创建bp.py编写代码，实现一个**基本的全连接神经网络**，这并不需要太多代码。我们在这里依然采用面向对象设计。
首先，我们先做一个基本的模型：
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705924989236-fbfad4b7-3208-4c9b-a922-467b0ae92821.png#averageHue=%23f7f7f7&clientId=uaba10839-7aa6-4&from=paste&id=u2b1f0a37&originHeight=305&originWidth=360&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=u3f6dd607-28e4-488a-b3fd-b6d0f502018&title=)
如上图，可以分解出5个领域对象来实现神经网络：

- _Network_ 神经网络对象，提供API接口。它由若干层对象组成以及连接对象组成。
- _Layer_ 层对象，由多个节点组成。
- _Node_ 节点对象计算和记录节点自身的信息(比如输出值a、误差项等δ)，以及与这个节点相关的上下游的连接。
- _Connection_ 每个连接对象都要记录该连接的权重。
- _Connections_ 仅仅作为Connection的集合对象，提供一些集合操作。
### Node实现
```python
# 节点类，负责记录和维护节点自身信息以及与这个节点相关的上下游连接，实现输出值和误差项的计算。
class Node():
    def __init__(self, layer_index, node_index):
        '''
        构造节点对象。
        layer_index: 节点所属的层的编号
        node_index: 节点的编号
        '''
        self.layer_index = layer_index
        self.node_index = node_index
        self.downstream = []
        self.upstream = []
        self.output = 0
        self.delta = 0

    def set_output(self, output):
        '''
        设置节点的输出值。如果节点属于输入层会用到这个函数。
        '''
        self.output = output

    def append_downstream_connection(self, conn):
        '''
        添加一个到下游节点的连接
        '''
        self.downstream.append(conn)

    def append_upstream_connection(self, conn):
        '''
        添加一个到上游节点的连接
        '''
        self.upstream.append(conn)

    def calc_output(self):
        '''
        根据式1计算节点的输出
        '''
        # 每个节点的输出算法，N元一次方程求和
        output = reduce(lambda ret, conn: ret + conn.upstream_node.output * conn.weight, self.upstream, 0)
        # 结果放入激活函数
        self.output = sigmoid(output)

    def calc_hidden_layer_delta(self):
        '''
        节点属于隐藏层时，根据式4计算delta
        '''
        downstream_delta = reduce(
            lambda ret, conn: ret + conn.downstream_node.delta * conn.weight,
            self.downstream, 0.0)
        self.delta = self.output * (1 - self.output) * downstream_delta

    def calc_output_layer_delta(self, label):
        '''
        节点属于输出层时，根据式3计算delta
        '''
        self.delta = self.output * (1 - self.output) * (label - self.output)

    def __str__(self):
        '''
        打印节点的信息
        '''
        node_str = '%u-%u: output: %f delta: %f' % (self.layer_index, self.node_index, self.output, self.delta)
        downstream_str = reduce(lambda ret, conn: ret + '\n\t' + str(conn), self.downstream, '')
        upstream_str = reduce(lambda ret, conn: ret + '\n\t' + str(conn), self.upstream, '')
        return node_str + '\n\tdownstream:' + downstream_str + '\n\tupstream:' + upstream_str
```
### ConstNode对象，为了实现一个输出恒为1的节点(计算偏置项wb时需要)
```python
class ConstNode():
    def __init__(self, layer_index, node_index):
        '''
        构造节点对象。
        layer_index: 节点所属的层的编号
        node_index: 节点的编号
        '''    
        self.layer_index = layer_index
        self.node_index = node_index
        self.downstream = []
        self.output = 1
    def append_downstream_connection(self, conn):
        '''
        添加一个到下游节点的连接
        '''       
        self.downstream.append(conn)
    def calc_hidden_layer_delta(self):
        '''	
        节点属于隐藏层时，根据式4计算delta
        '''
        downstream_delta = reduce(
            lambda ret, conn: ret + conn.downstream_node.delta * conn.weight,
            self.downstream, 0.0)
        self.delta = self.output * (1 - self.output) * downstream_delta
    def __str__(self):
        '''
        打印节点的信息
        '''
        node_str = '%u-%u: output: 1' % (self.layer_index, self.node_index)
        downstream_str = reduce(lambda ret, conn: ret + '\n\t' + str(conn), self.downstream, '')
        return node_str + '\n\tdownstream:' + downstream_str
```
### Layer对象，负责初始化一层。此外，作为Node的集合对象，提供对Node集合的操作。
```python
class Layer():
    def __init__(self, layer_index, node_count):
        '''
        初始化一层
        layer_index: 层编号
        node_count: 层所包含的节点个数
        '''
        self.layer_index = layer_index
        self.nodes = []
        for i in range(node_count):
            self.nodes.append(Node(layer_index, i))
        self.nodes.append(ConstNode(layer_index, node_count))
    def set_output(self, data):
        '''
        设置层的输出。当层是输入层时会用到。
        '''
        for i in range(len(data)):
            self.nodes[i].set_output(data[i])
    def calc_output(self):
        '''
        计算层的输出向量
        '''
        for node in self.nodes[:-1]:
            node.calc_output()
    def dump(self):
        '''
        打印层的信息
        '''
        for node in self.nodes:
            print(node)
```
### Connection
Connection对象，主要职责是记录连接的权重，以及这个连接所关联的上下游节点。
```python
class Connection():
    def __init__(self, upstream_node, downstream_node):
        '''
        初始化连接，权重初始化为是一个很小的随机数
        upstream_node: 连接的上游节点
        downstream_node: 连接的下游节点
        '''
        self.upstream_node = upstream_node
        self.downstream_node = downstream_node
        self.weight = random.uniform(-0.1, 0.1)
        self.gradient = 0.0
    def calc_gradient(self):
        '''
        计算梯度
        '''
        self.gradient = self.downstream_node.delta * self.upstream_node.output
    def get_gradient(self):
        '''
        获取当前的梯度
        '''
        return self.gradient
    def update_weight(self, rate):
        '''
        根据梯度下降算法更新权重
        '''
        self.calc_gradient()
        self.weight += rate * self.gradient
    def __str__(self):
        '''
        打印连接信息
        '''
        return '(%u-%u) -> (%u-%u) = %f' % (
            self.upstream_node.layer_index, 
            self.upstream_node.node_index,
            self.downstream_node.layer_index, 
            self.downstream_node.node_index, 
            self.weight)
```
### Connection
Connections对象，提供Connection集合操作。
```python
class Connections():
    def __init__(self):
        self.connections = []
    def add_connection(self, connection):
        self.connections.append(connection)
    def dump(self):
        for conn in self.connections:
            print(conn)
```
### Network对象，提供API。
```python
class Network():
    def __init__(self, layers):
        '''
        初始化一个全连接神经网络
        layers: 二维数组，描述神经网络每层节点数
        '''
        self.connections = Connections()
        self.layers = []
        layer_count = len(layers)
        node_count = 0;
        for i in range(layer_count):
            self.layers.append(Layer(i, layers[i]))
        for layer in range(layer_count - 1):
            connections = [Connection(upstream_node, downstream_node) 
                           for upstream_node in self.layers[layer].nodes
                           for downstream_node in self.layers[layer + 1].nodes[:-1]]
            for conn in connections:
                self.connections.add_connection(conn)
                conn.downstream_node.append_upstream_connection(conn)
                conn.upstream_node.append_downstream_connection(conn)
    def train(self, labels, data_set, rate, iteration):
        '''
        训练神经网络
        labels: 数组，训练样本标签。每个元素是一个样本的标签。
        data_set: 二维数组，训练样本特征。每个元素是一个样本的特征。
        '''
        for i in range(iteration):
            for d in range(len(data_set)):
                self.train_one_sample(labels[d], data_set[d], rate)
    def train_one_sample(self, label, sample, rate):
        '''
        内部函数，用一个样本训练网络
        '''
        self.predict(sample)
        self.calc_delta(label)
        self.update_weight(rate)
    def calc_delta(self, label):
        '''
        内部函数，计算每个节点的delta
        '''
        output_nodes = self.layers[-1].nodes
        for i in range(len(label)):
            output_nodes[i].calc_output_layer_delta(label[i])
        for layer in self.layers[-2::-1]:
            for node in layer.nodes:
                node.calc_hidden_layer_delta()
    def update_weight(self, rate):
        '''
        内部函数，更新每个连接权重
        '''
        for layer in self.layers[:-1]:
            for node in layer.nodes:
                for conn in node.downstream:
                    conn.update_weight(rate)
    def calc_gradient(self):
        '''
        内部函数，计算每个连接的梯度
        '''
        for layer in self.layers[:-1]:
            for node in layer.nodes:
                for conn in node.downstream:
                    conn.calc_gradient()
    def get_gradient(self, label, sample):
        '''
        获得网络在一个样本下，每个连接上的梯度
        label: 样本标签
        sample: 样本输入
        '''
        self.predict(sample)
        self.calc_delta(label)
        self.calc_gradient()
    def predict(self, sample):
        '''
        根据输入的样本预测输出值
        sample: 数组，样本的特征，也就是网络的输入向量
        '''
        self.layers[0].set_output(sample)
        for i in range(1, len(self.layers)):
            self.layers[i].calc_output()
        return list(map(lambda node: node.output, self.layers[-1].nodes[:-1]))
    def dump(self):
        '''
        打印网络信息
        '''
        for layer in self.layers:
            layer.dump()
```

至此，实现了一个基本的全连接神经网络。可以看到，同神经网络的强大学习能力相比，其实现还算是很容易的。
### 梯度检查
怎么保证自己写的神经网络没有BUG呢？事实上这是一个非常重要的问题。一方面，千辛万苦想到一个算法，结果效果不理想，那么是算法本身错了还是代码实现错了呢？定位这种问题肯定要花费大量的时间和精力。另一方面，由于神经网络的复杂性，我们几乎无法事先知道神经网络的输入和输出，因此类似TDD(测试驱动开发)这样的开发方法似乎也不可行。
办法还是有滴，就是利用梯度检查来确认程序是否正确。梯度检查的思路如下：
对于梯度下降算法：
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705925379352-76a4cf66-e65a-4547-bbce-f7359ee3b215.png#averageHue=%23f5f5f5&clientId=uaba10839-7aa6-4&from=paste&height=431&id=u03f90e18&originHeight=539&originWidth=924&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=76152&status=done&style=none&taskId=u94a4b879-4d67-489d-950a-d6da6ac8094&title=&width=739.2)
#### 代码实现
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1705925399992-b722ffed-e06c-47fc-9d08-43268f1d2b8b.png#averageHue=%23f1f1f1&clientId=uaba10839-7aa6-4&from=paste&height=274&id=u4b97aace&originHeight=343&originWidth=943&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=51460&status=done&style=none&taskId=uac52bb2b-7de5-40ef-a708-908f539a9de&title=&width=754.4)
```python
def gradient_check(network, sample_feature, sample_label):
    '''
    梯度检查
    network: 神经网络对象
    sample_feature: 样本的特征
    sample_label: 样本的标签
    '''
    # 计算网络误差
    network_error = lambda vec1, vec2: \
            0.5 * reduce(lambda a, b: a + b, 
                      map(lambda v: (v[0] - v[1]) * (v[0] - v[1]),
                          zip(vec1, vec2)))
    # 获取网络在当前样本下每个连接的梯度
    network.get_gradient(sample_feature, sample_label)
    # 对每个权重做梯度检查    
    for conn in network.connections.connections: 
        # 获取指定连接的梯度
        actual_gradient = conn.get_gradient()
        # 增加一个很小的值，计算网络的误差
        epsilon = 0.0001
        conn.weight += epsilon
        error1 = network_error(network.predict(sample_feature), sample_label)
        # 减去一个很小的值，计算网络的误差
        conn.weight -= 2 * epsilon # 刚才加过了一次，因此这里需要减去2倍
        error2 = network_error(network.predict(sample_feature), sample_label)
        # 根据式6计算期望的梯度值
        expected_gradient = (error2 - error1) / (2 * epsilon)
        # 打印
        print('expected gradient: \t%f\nactual gradient: \t%f' % (
            expected_gradient, actual_gradient))
```
至此，会推导、会实现、会抓BUG，你已经摸到深度学习的大门了。接下来还需要不断的实践，我们用刚刚写过的神经网络去识别手写数字。
## 神经网络实战---手写数字识别
针对这个任务，我们采用业界非常流行的MNIST数据集。MNIST大约有60000个手写字母的训练样本，我们使用它训练我们的神经网络，然后再用训练好的网络去识别手写数字。
MNIST数据集下载地址见**文章末尾**。
手写数字识别是个比较简单的任务，数字只可能是0-9中的一个，这是个10分类问题。
完整代码请参考GitHub：[点击查看](https://github.com/Jack-Cherish/Deep-Learning/blob/master/Tutorial/lesson-3/mnist.py)
### 超参数的确定（网络层数和每层的节点数）
我们首先需要**确定网络的层数和每层的节点数**。关于第一个问题，实际上**并没有什么理论化的方法**，大家都是根据经验来拍，如果没有经验的话就随便拍一个。然后，你可以多试几个值，训练不同层数的神经网络，看看哪个效果最好就用哪个。嗯，现在你可能明白为什么说深度学习是个手艺活了，有些手艺很让人无语，而有些手艺还是很有技术含量的。
不过，有些基本道理我们还是明白的，我们知道**网络层数越多越好**，也知道**层数越多训练难度越大**。对于**全连接网络**，**隐藏层最好不要超过三层**。那么，我们可以先试试仅有一个隐藏层的神经网络效果怎么样。毕竟模型小的话，训练起来也快些(刚开始玩模型的时候，都希望快点看到结果)。
**输入层节点数是确定的**。因为MNIST数据集每个训练数据是28*28的图片，共784个像素，因此，输入层节点数应该是784，每个像素对应一个输入节点。
**输出层节点数也是确定的**。因为是**10分类**，我们可以用10个节点，每个节点对应一个分类。输出层10个节点中，输出最大值的那个节点对应的分类，就是模型的预测结果。
隐藏层节点数量是不好确定的，从1到100万都可以。下面有几个经验公式：
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706012590255-20453ef2-6756-4750-922e-abe5b38a21a3.png#averageHue=%23fefdfb&clientId=u25a55d6b-4052-4&from=paste&height=327&id=u07d4912e&originHeight=200&originWidth=169&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=u4d97ad18-0d2c-4d97-af4c-d38ce0aeaca&title=&width=276)
因此，我们可以先根据上面的公式设置一个隐藏层节点数。如果有时间，我们可以设置不同的节点数，分别训练，看看哪个效果最好就用哪个。我们先拍一个，设隐藏层节点数为300吧。
对于3层784∗300∗10的全连接网络，总共有300∗(784+1)+10∗(300+1)=238510个参数！神经网络之所以强大，是它提供了一种非常简单的方法去实现大量的参数。目前百亿参数、千亿样本的超大规模神经网络也是有的。因为MNIST只有6万个训练样本，**参数太多了很容易过拟合**，效果反而不好。
### 模型的训练和评估
MNIST数据集包含10000个测试样本。我们先用60000个训练样本训练我们的网络，然后再用测试样本对网络进行测试，计算识别错误率：
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706012698688-9348f4af-9191-4629-83cc-b17d9e2cc10d.png#averageHue=%23fbfbfb&clientId=u25a55d6b-4052-4&from=paste&height=46&id=uf09bf983&originHeight=58&originWidth=850&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=3754&status=done&style=none&taskId=u7aa9b55c-19b4-4362-9a09-1f74fd2de14&title=&width=680)
我们每训练10轮，评估一次准确率。当准确率开始下降时（出现了过拟合）终止训练。
### 代码实现
首先，我们需要把**MNIST数据集处理为神经网络能够接受的形式**。MNIST训练集的文件格式可以参考官方网站，这里不在赘述。
每个训练样本是一个28*28的图像，我们按照行优先，把它转化为一个784维的向量。每个标签是0-9的值，我们将其转换为一个10维的one-hot向量：如果标签值为n，我们就把向量的第n维（从0开始编号）设置为0.9，而其它维设置为0.1。例如，向量[0.1,0.1,0.9,0.1,0.1,0.1,0.1,0.1,0.1,0.1]表示值2。
#### 数据集下载地址
[mnist文件下载地址](https://cuijiahua.com/wp-content/themes/begin/down.php?id=4236)
#### mnist.py
创建mnist.py文件，编写代码如下：
```python
#-*- coding:utf-8 -*-
from bp import *
from datetime import datetime

# 数据加载器基类
class Loader():
    def __init__(self, path, count):
        '''
        初始化加载器
        path: 数据文件路径
        count: 文件中的样本个数
        '''
        self.path = path
        self.count = count
    def get_file_content(self):
        '''
        读取文件内容
        '''
        f = open(self.path, 'rb')
        content = f.read()
        f.close()
        return content

# 图像数据加载器
class ImageLoader(Loader):
    def get_picture(self, content, index):
        '''
        内部函数，从文件中获取图像
        '''
        start = index * 28 * 28 + 16
        picture = []
        for i in range(28):
            picture.append([])
            for j in range(28):
                picture[i].append(content[start + i * 28 + j])
        return picture
    def get_one_sample(self, picture):
        '''
        内部函数，将图像转化为样本的输入向量
        '''
        sample = []
        for i in range(28):
            for j in range(28):
                sample.append(picture[i][j])
        return sample
    def load(self):
        '''
        加载数据文件，获得全部样本的输入向量
        '''
        content = self.get_file_content()
        data_set = []
        for index in range(self.count):
            data_set.append(
                self.get_one_sample(
                    self.get_picture(content, index)))
        return data_set
# 标签数据加载器
class LabelLoader(Loader):
    def load(self):
        '''
        加载数据文件，获得全部样本的标签向量
        '''
        content = self.get_file_content()
        labels = []
        for index in range(self.count):
            labels.append(self.norm(content[index + 8]))
        return labels
    def norm(self, label):
        '''
        内部函数，将一个值转换为10维标签向量
        '''
        label_vec = []
        label_value = label
        for i in range(10):
            if i == label_value:
                label_vec.append(0.9)
            else:
                label_vec.append(0.1)
        return label_vec
def get_training_data_set():
    '''
    获得训练数据集
    '''
    image_loader = ImageLoader('train-images.idx3-ubyte', 60000)
    label_loader = LabelLoader('train-labels.idx1-ubyte', 60000)
    return image_loader.load(), label_loader.load()
def get_test_data_set():
    '''
    获得测试数据集
    '''
    image_loader = ImageLoader('t10k-images.idx3-ubyte', 10000)
    label_loader = LabelLoader('t10k-labels.idx1-ubyte', 10000)
    return image_loader.load(), label_loader.load()


def get_result(vec):
    max_value_index = 0
    max_value = 0
    for i in range(len(vec)):
        if vec[i] > max_value:
            max_value = vec[i]
            max_value_index = i
    return max_value_index

def evaluate(network, test_data_set, test_labels):
    error = 0
    total = len(test_data_set)
    for i in range(total):
        label = get_result(test_labels[i])
        predict = get_result(network.predict(test_data_set[i]))
        if label != predict:
            error += 1
    return float(error) / float(total)

def train_and_evaluate():
    last_error_ratio = 1.0
    epoch = 0
    train_data_set, train_labels = get_training_data_set()
    test_data_set, test_labels = get_test_data_set()
    network = Network([784, 300, 10])
    while True:
        epoch += 1
        network.train(train_labels, train_data_set, 0.3, 1)
        print('%s epoch %d finished' % (now(), epoch))
        if epoch % 10 == 0:
            error_ratio = evaluate(network, test_data_set, test_labels)
            print('%s after epoch %d, error ratio is %f' % (now(), epoch, error_ratio))
            if error_ratio > last_error_ratio:
                break
            else:
                last_error_ratio = error_ratio

if __name__ == '__main__':
    train_and_evaluate()
```
#### 神经网络输出
网络的输出是一个10维向量，这个向量第个(从0开始编号)元素的值最大，那么就是网络的识别结果。下面是代码实现：
```python
def get_result(vec):
    max_value_index = 0
    max_value = 0
    for i in range(len(vec)):
        if vec[i] > max_value:
            max_value = vec[i]
            max_value_index = i
    return max_value_index
```
#### 评估
我们使用**错误率**来对网络进行评估，下面是代码实现：
```python
def evaluate(network, test_data_set, test_labels):
    error = 0
    total = len(test_data_set)
    for i in range(total):
        label = get_result(test_labels[i])
        predict = get_result(network.predict(test_data_set[i]))
        if label != predict:
            error += 1
    return float(error) / float(total)

```
#### 训练策略
最后实现我们的训练策略：每训练10轮，评估一次准确率，当准确率开始下降时终止训练。下面是代码实现：
```python
def train_and_evaluate():
    last_error_ratio = 1.0
    epoch = 0
    train_data_set, train_labels = get_training_data_set()
    test_data_set, test_labels = get_test_data_set()
    network = Network([784, 300, 10])
    while True:
        epoch += 1
        network.train(train_labels, train_data_set, 0.3, 1)
        print '%s epoch %d finished' % (now(), epoch)
        if epoch % 10 == 0:
            error_ratio = evaluate(network, test_data_set, test_labels)
            print '%s after epoch %d, error ratio is %f' % (now(), epoch, error_ratio)
            if error_ratio > last_error_ratio:
                break
            else:
                last_error_ratio = error_ratio
if __name__ == '__main__':
    train_and_evaluate()
```
运行mnist.py文件，开始训练。在我的机器上测试了一下，1个epoch大约需要9000多秒，所以要对代码做很多的性能优化工作（比如用向量化编程）。训练要很久很久，可以把它上传到服务器上，在tmux的session里面去运行。为了防止异常终止导致前功尽弃，我们每训练10轮，就把获得参数值保存在磁盘上，以便后续可以恢复。(代码略)

## 向量化编程
完整代码请参考GitHub：[点击查看](https://github.com/Jack-Cherish/Deep-Learning/blob/master/Tutorial/lesson-3/fc.py)
在经历了漫长的训练之后，我们可能会想到，肯定有更好的办法！是的，程序员们，现在我们需要告别面向对象编程了，转而去使用另外一种更适合深度学习算法的编程方式：**向量化编程**。
主要有两个原因：一个是我们事实上**并不需要真的去定义Node、Connection这样的对象**，直接把数学计算实现了就可以了；另一个原因，是**底层算法库会针对向量运算做优化（甚至有专用的硬件，比如GPU**），程序效率会提升很多。所以，在深度学习的世界里，我们总会想法设法的把计算表达为向量的形式。我相信优秀的程序员不会把自己拘泥于某种（自己熟悉的）编程范式上，而会去学习并使用最为合适的范式。
下面，我们用向量化编程的方法，重新实现前面的**全连接神经网络**。
首先，我们需要把所有的计算都表达为向量的形式。对于全连接神经网络来说，主要有三个计算公式。
前向计算，我们发现**式2**已经是向量化的表达了：
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706012974584-99186a9a-31bc-4294-b5ce-ab90f28afd12.png#averageHue=%23fcfcfc&clientId=u25a55d6b-4052-4&from=paste&height=51&id=ucbff3348&originHeight=64&originWidth=874&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=4466&status=done&style=none&taskId=ub206ad41-ed80-42db-b295-849f53b5cd7&title=&width=699.2)
上式中的σ表示sigmoid函数。
反向计算，我们需要把**式3**和**式4**使用向量来表示：
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706012995259-c67eed4d-50c2-47ed-9a56-315f7291792a.png#averageHue=%23fafafa&clientId=u25a55d6b-4052-4&from=paste&height=84&id=u9de7ee51&originHeight=105&originWidth=884&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=11234&status=done&style=none&taskId=u7c6e12f3-9fe5-40e3-80b6-179df8ebd41&title=&width=707.2)
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706013015667-e4c92be3-43a3-49f7-a087-ccd9ab26bf80.png#averageHue=%23f7f7f7&clientId=u25a55d6b-4052-4&from=paste&height=298&id=u1c86a803&originHeight=372&originWidth=900&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=37081&status=done&style=none&taskId=u3a26c25d-83d7-4027-82e1-2a219dd1b07&title=&width=720)
### FullConnectedLayer
现在，我们根据上面几个公式，重新实现一个类：FullConnectedLayer。它实现了全连接层的前向和后向计算：
```python
import numpy as np
# 全连接层实现类
class FullConnectedLayer():
    def __init__(self, input_size, output_size, 
                 activator):
        '''
        构造函数
        input_size: 本层输入向量的维度
        output_size: 本层输出向量的维度	
        activator: 激活函数
        '''
        self.input_size = input_size
        self.output_size = output_size
        self.activator = activator
        # 权重数组W
        self.W = np.random.uniform(-0.1, 0.1,
            (output_size, input_size))
        # 偏置项b
        self.b = np.zeros((output_size, 1))
        # 输出向量
        self.output = np.zeros((output_size, 1))
    def forward(self, input_array):
        '''
        前向计算
        input_array: 输入向量，维度必须等于input_size
        '''
        # 式2
        self.input = input_array
        self.output = self.activator.forward(
            np.dot(self.W, input_array) + self.b)
    def backward(self, delta_array):
        '''
        反向计算W和b的梯度
        delta_array: 从上一层传递过来的误差项
        '''
        # 式8
        self.delta = self.activator.backward(self.input) * np.dot(
            self.W.T, delta_array)
        self.W_grad = np.dot(delta_array, self.input.T)
        self.b_grad = delta_array
    def update(self, learning_rate):
        '''
        使用梯度下降算法更新权重
        '''
        self.W += learning_rate * self.W_grad
        self.b += learning_rate * self.b_grad
```
#### numpy.dot 
dot函数为numpy库下的一个函数，主要用于矩阵的乘法运算，其中包括：**向量内积**、**多维矩阵乘法**、**矩阵与向量的乘法**。
1、向量内积
向量是一维矩阵，两个向量进行内积运算时，需要保证两个向量包含的元素个数是相同的。
例：
```python
import numpy as np

x = np.array([1,2,3,4,5,6,7])
y = np.array([2,3,4,5,6,7,8])
result = np.dot(x, y)
print(result)
```
输出结果：
```
168
```
2、矩阵乘法运算
两个矩阵（x,y）如果可以进行乘法运算，需要满足以下条件：
x为mxn阶矩阵，y为nxp阶矩阵，则相乘的结果result为mxp阶矩阵。
例：
```python
import numpy as np

x = np.array([[1,2,3],[4,5,6]])
y = np.array([[2,3],[4,5],[6,7]])
result = np.dot(x, y)
print(result)
print("x阶数：" + str(x.shape))
print("y阶数：" + str(y.shape))
print("result阶数：" + str(result.shape))
```
输出结果：

```
[[28 34]
 [64 79]]
x阶数：(2, 3)
y阶数：(3, 2)
result阶数：(2, 2)
```
3、矩阵与向量乘法
矩阵x为mxn阶，向量y为n阶向量，则矩阵x和向量y可以进行乘法运算，结果为m阶向量。进行运算时，会首先将后面一项进行自动转置操作，之后再进行乘法运算。
```python
import numpy as np

x = np.array([[1,2,3],[4,5,6]])
y = np.array([1,2,3])
result = np.dot(x, y)
print(result)
print("x阶数：" + str(x.shape))
print("y阶数：" + str(y.shape))
print("result阶数：" + str(result.shape))
```
输出结果：
```
[14 32]
x阶数：(2, 3)
y阶数：(3,)
result阶数：(2,)
```
### Network
上面这个类一举取代了原先的Layer、Node、Connection等类，不但代码更加容易理解，而且运行速度也快了几百倍。
现在，我们对Network类稍作修改，使之用到FullConnectedLayer：
```python
# Sigmoid激活函数类
class SigmoidActivator(object):
    def forward(self, weighted_input):
        return 1.0 / (1.0 + np.exp(-weighted_input))
    def backward(self, output):
        return output * (1 - output)
# 神经网络类
class Network(object):
    def __init__(self, layers):
        '''
        构造函数
        '''
        self.layers = []
        for i in range(len(layers) - 1):
            self.layers.append(
                FullConnectedLayer(
                    layers[i], layers[i+1],
                    SigmoidActivator()
                )
            )
    def predict(self, sample):
        '''
        使用神经网络实现预测
        sample: 输入样本
        '''
        output = sample
        for layer in self.layers:
            layer.forward(output)
            output = layer.output
        return output
    def train(self, labels, data_set, rate, epoch):
        '''
        训练函数
        labels: 样本标签
        data_set: 输入样本
        rate: 学习速率
        epoch: 训练轮数
        '''
        for i in range(epoch):
            for d in range(len(data_set)):
                self.train_one_sample(labels[d], 
                    data_set[d], rate)
    def train_one_sample(self, label, sample, rate):
        self.predict(sample)
        self.calc_gradient(label)
        self.update_weight(rate)
    def calc_gradient(self, label):
        delta = self.layers[-1].activator.backward(
            self.layers[-1].output
        ) * (label - self.layers[-1].output)
        for layer in self.layers[::-1]:
            layer.backward(delta)
            delta = layer.delta
        return delta
    def update_weight(self, rate):
        for layer in self.layers:
            layer.update(rate)
```
现在，Network类也清爽多了，用我们的新代码再次训练一下MNIST数据集吧。
## 小结
至此，你已经完成了又一次漫长的学习之旅。你现在应该已经明白了神经网络的基本原理，高兴的话，你甚至有能力去动手实现一个，并用它解决一些问题。如果感到困难也不要气馁，这篇文章是一个重要的分水岭，如果你完全弄明白了的话，在真正的『小白』和装腔作势的『大牛』面前吹吹牛是完全没有问题的。
作为深度学习入门的系列文章，本文也是上半场的结束。在这个半场，你掌握了机器学习、神经网络的**基本**概念，并且有能力去动手解决一些简单的问题（例如手写数字识别，如果用传统的观点来看，其实这些问题也不简单）。而且，一旦掌握基本概念，后面的学习就容易多了。
在下半场，我们讲介绍更多『深度』学习的内容，我们已经讲了神经网络(Neutrol Network)，但是并没有讲深度神经网络(Deep Neutrol Network)。Deep会带来更加强大的能力，同时也带来更多的问题。如果不理解这些问题和它们的解决方案，也不能说你入门了『深度』学习。
目前业界有很多开源的神经网络实现，它们的功能也要强大的多，因此你并不需要事必躬亲的去实现自己的神经网络。我们在上半场不断的从头发明轮子，是为了让你明白神经网络的基本原理，这样你就能非常迅速的掌握这些工具。在下半场的文章中，我们改变了策略：不会再去从头开始去实现，而是尽可能应用现有的工具。
下一篇文章，我们介绍不同结构的神经网络，比如鼎鼎大名的**卷积神经网络**，它在图像和语音领域已然创造了诸多奇迹，在自然语言处理领域的研究也如火如荼。某种意义上说，它的成功大大提升了人们对于深度学习的信心。
[mnist文件下载地址](https://cuijiahua.com/wp-content/themes/begin/down.php?id=4236)

# 卷积神经网络
## 往期回顾
在前面的文章中，我们介绍了**全连接神经网络**，以及它的训练和使用。我们用它来识别了手写数字，然而，这种结构的网络对于图像识别任务来说并不是很合适。本文将要介绍一种更适合图像、语音识别任务的神经网络结构——**卷积神经网络**(Convolutional Neural Network, CNN)。
说**卷积神经网络是最重要的**一种神经网络也不为过，它在最近几年大放异彩，几乎所有图像、语音识别领域的重要突破都是卷积神经网络取得的，比如谷歌的GoogleNet、微软的ResNet等，打败李世石的AlphaGo也用到了这种网络。本文将详细介绍**卷积神经网络**以及它的训练算法，以及动手实现一个简单的**卷积神经网络**。
## 一个新的激活函数--Relu
最近几年卷积神经网络中，激活函数往往不选择sigmoid或tanh函数，而是选择relu函数。Relu函数的定义是：
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706863210165-4b386988-a1e2-43bb-a5b3-f5a296681453.png#averageHue=%23fefefe&clientId=ud5ae2333-ede6-4&from=paste&height=38&id=uf8488a9d&originHeight=47&originWidth=272&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=5627&status=done&style=none&taskId=u0b6d59c8-a6ba-4161-85b2-c997a80eb8f&title=&width=217.6)
Relu函数图像如下图所示：
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706863223661-f1ec1045-192d-44f1-ac23-176797938dd9.png#averageHue=%23fafafa&clientId=ud5ae2333-ede6-4&from=paste&id=u02e1b802&originHeight=233&originWidth=268&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=u5dbc0bf3-419a-4315-971a-9b9f7e34470&title=)
Relu函数作为激活函数，有下面几大优势：

- **速度快** 和sigmoid函数需要计算指数和倒数相比，relu函数其实就是一个max(0,x)，计算代价小很多。

![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706863263933-0371f1a5-d44e-4a1c-8a4d-28032fec5a88.png#averageHue=%23ebebeb&clientId=ud5ae2333-ede6-4&from=paste&height=178&id=ube7b4c10&originHeight=222&originWidth=870&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=43818&status=done&style=none&taskId=u00749605-b07d-4682-ad31-0abac0ede6c&title=&width=696)
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706863268655-087967c0-feaf-4ab1-b0b0-ed64e59b65b0.png#averageHue=%23fafafa&clientId=ud5ae2333-ede6-4&from=paste&id=ua1eeae1c&originHeight=233&originWidth=360&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=ue2143b36-87bd-4fc7-a03a-2b99d7795e0&title=)

- **稀疏性** 通过对大脑的研究发现，大脑在工作的时候只有大约5%的神经元是激活的，而采用sigmoid激活函数的人工神经网络，其激活率大约是50%。有论文声称人工神经网络在15%-30%的激活率时是比较理想的。因为relu函数在输入小于0时是完全不激活的，因此可以获得一个更低的激活率。
## 全连接神经网络VS卷积神经网络
**全连接神经网络**之所以**不太适合图像识别任务**，主要有以下几个方面的问题：

- **参数数量太多** 考虑一个输入1000*1000像素的图片(一百万像素，现在已经不能算大图了)，输入层有1000*1000=100万节点。假设第一个隐藏层有100个节点(这个数量并不多)，那么仅这一层就有(1000*1000+1)*100=1亿参数，这实在是太多了！我们看到图像只扩大一点，参数数量就会多很多，因此它的扩展性很差。
- **没有利用像素之间的位置信息** 对于图像识别任务来说，**每个像素和其周围像素的联系是比较紧密的**，和离得很远的像素的联系可能就很小了。如果一个神经元和上一层所有神经元相连，那么就相当于对于一个像素来说，把图像的所有像素都等同看待，这不符合前面的假设。当我们完成每个连接权重的学习之后，最终可能会发现，有大量的权重，它们的值都是很小的(也就是这些连接其实无关紧要)。努力学习大量并不重要的权重，这样的学习必将是非常低效的。
- **网络层数限制** 我们知道**网络层数越多其表达能力越强**，但是通过梯度下降方法训练深度全连接神经网络很困难，因为全连接神经网络的梯度很难传递超过3层。因此，我们不可能得到一个很深的全连接神经网络，也就限制了它的能力。

那么，卷积神经网络又是怎样解决这个问题的呢？主要有三个思路：

- **局部连接** 这个是最容易想到的，**每个神经元不再和上一层的所有神经元相连**，而只和一小部分神经元相连。这样就减少了很多参数。
- **权值共享** 一组连接可以共享同一个权重，而不是每个连接有一个不同的权重，这样又减少了很多参数。
- **下采样** 可以使用Pooling来减少每层的样本数，进一步减少参数数量，同时还可以提升模型的鲁棒性。

对于图像识别任务来说，卷积神经网络通过尽可能保留重要的参数，去掉大量不重要的参数，来达到更好的学习效果。
接下来，我们将详述卷积神经网络到底是何方神圣。
## 卷积神经网络是啥
首先，我们先获取一个感性认识，下图是一个卷积神经网络的示意图：
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706863425991-a11f7a89-6e06-4290-a22c-ae1b33d3fc37.png#averageHue=%23fefefe&clientId=ud5ae2333-ede6-4&from=paste&id=uede34f43&originHeight=225&originWidth=800&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=ub53a2009-3532-43b7-9f3a-8d45d80b413&title=)
**图1**
### 网络架构
如**图1**所示，一个卷积神经网络由若干**卷积层**、**Pooling层**、**全连接层**组成。你可以构建各种不同的卷积神经网络，它的常用架构模式为：
```python
INPUT -> [[CONV]*N -> POOL?]*M -> [FC]*K
```
也就是N个卷积层叠加，然后(可选)叠加一个Pooling层，重复这个结构M次，最后叠加K个全连接层。
对于**图1**展示的卷积神经网络：
```python
INPUT -> CONV -> POOL -> CONV -> POOL -> FC -> FC
```
按照上述模式可以表示为：
```python
INPUT -> [[CONV]*1 -> POOL]*2 -> [FC]*2
```
也就是：N=1, M=2, K=2。
### 三维的层结构
从**图1**我们可以发现**卷积神经网络**的层结构和**全连接神经网络**的层结构有很大不同。**全连接神经网络**每层的神经元是按照**一维**排列的，也就是排成一条线的样子；而**卷积神经网络**每层的神经元是按照**三维**排列的，也就是排成一个长方体的样子，有**宽度**、**高度**和**深度**。
对于**图1**展示的神经网络，我们看到**输入层的宽度和高度对应于输入图像的宽度和高度**，而它的**深度为1**。接着，**第一个卷积层**对这幅图像进行了卷积操作(后面我们会讲如何计算卷积)，得到了**三个Feature Map**。这里的"3"可能是让很多初学者迷惑的地方，实际上，就是这个卷积层包含三个Filter，也就是三套参数，每个Filter都可以把原始输入图像卷积得到一个Feature Map，三个Filter就可以得到三个Feature Map。至于一个卷积层可以有多少个Filter，那是可以自由设定的。也就是说，卷积层的Filter个数也是一个**超参数**。我们可以把Feature Map可以看做是通过卷积变换提取到的图像特征，三个Filter就对原始图像提取出三组不同的特征，也就是得到了三个Feature Map，也称做三个**通道(channel)**。
继续观察**图1**，在第一个卷积层之后，Pooling层对三个Feature Map做了**下采样**(后面我们会讲如何计算下采样)，得到了三个**更小的Feature Map**。接着，是第二个**卷积层**，它有**5个Filter**。每个Fitler都把前面**下采样**之后的**3个**Feature Map**卷积**在一起，得到一个新的Feature Map。这样，5个Filter就得到了5个Feature Map。接着，是第二个Pooling，继续对5个Feature Map进行**下采样**，得到了5个更小的Feature Map。
**图1**所示网络的最后两层是全连接层。第一个全连接层的每个神经元，和上一层5个Feature Map中的每个神经元相连，第二个全连接层(也就是输出层)的每个神经元，则和第一个全连接层的每个神经元相连，这样得到了整个网络的输出。
至此，我们对**卷积神经网络**有了最基本的感性认识。接下来，我们将介绍**卷积神经网络**中各种层的计算和训练。
## 卷积神经网络输出值的计算
### 卷积层输出值的计算
我们用一个简单的例子来讲述如何计算**卷积**，然后，我们抽象出**卷积层**的一些重要概念和计算方法。
假设有一个5*5的图像，使用一个3*3的filter进行卷积，想得到一个3*3的Feature Map，如下所示：
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706863819940-10eca462-c2b4-495d-828e-1e6fe91ec5f5.png#averageHue=%23ebd7c5&clientId=ud5ae2333-ede6-4&from=paste&id=u035b439a&originHeight=261&originWidth=640&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=uec6525b3-0b86-4a78-907d-b8274009be2&title=)
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706863835438-3aa35332-5b54-439a-baec-9d94818bee10.png#averageHue=%23e9e9e9&clientId=ud5ae2333-ede6-4&from=paste&height=120&id=u7df8c0ee&originHeight=150&originWidth=941&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=36234&status=done&style=none&taskId=uafbe112a-1022-4958-8966-d2984de442b&title=&width=752.8)
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706863845525-543ef4fc-d6d5-413a-a24d-d81f7062fc2a.png#averageHue=%23fefefe&clientId=ud5ae2333-ede6-4&from=paste&id=u8c1e8c01&originHeight=74&originWidth=395&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=u3cb49860-b968-45c6-88be-2fb3dae13e8&title=)
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706863869806-ac4815f2-dc5d-44c9-af5a-8b7f05580939.png#averageHue=%23f8f8f8&clientId=ud5ae2333-ede6-4&from=paste&height=246&id=uacede634&originHeight=308&originWidth=933&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=51409&status=done&style=none&taskId=ub6644a7e-90e0-4794-b5dd-df66bfa502f&title=&width=746.4)
计算结果如下图所示：
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706863914790-7842e38c-a48c-4ea6-8228-d17ef138a949.png#averageHue=%23ebd7c5&clientId=ud5ae2333-ede6-4&from=paste&id=ua2cd00c0&originHeight=262&originWidth=640&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=u68566897-a8f2-437c-9c24-9fe68104d9a&title=)
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706863929341-500abac4-40c9-48f7-954b-1288b621b0be.png#averageHue=%23f8f8f8&clientId=ud5ae2333-ede6-4&from=paste&height=255&id=u7d8fdb39&originHeight=319&originWidth=875&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=50225&status=done&style=none&taskId=u2233f6e3-f6e8-428f-aaef-cb8db857ab0&title=&width=700)
计算结果如下图所示：
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706863940207-a2d3ea06-20b7-4817-a0f4-c33e8dae7ab2.png#averageHue=%23edd8c7&clientId=ud5ae2333-ede6-4&from=paste&id=u54ed7bac&originHeight=264&originWidth=640&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=u7d23784f-79af-486b-b10a-8a3d797c084&title=)
可以依次计算出Feature Map中所有元素的值。下面的动画显示了整个Feature Map的计算过程：
![](https://cdn.nlark.com/yuque/0/2024/gif/40625813/1706863954457-4a16224f-706e-4a09-97e6-651e0c5cf9b7.gif#averageHue=%23e9e1ce&clientId=ud5ae2333-ede6-4&from=paste&height=374&id=u5b49c641&originHeight=384&originWidth=526&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=u9c2ba5d8-59fd-4af1-8239-2352b4f7ab5&title=&width=512)
上面的计算过程中，**步幅(stride)为1**。步幅可以设为大于1的数。例如，当**步幅为2**时，Feature Map计算如下：
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706863984257-020d9578-89fb-4af5-87aa-4a02de7b4612.png#averageHue=%23f0e5d3&clientId=ud5ae2333-ede6-4&from=paste&id=u9fd76052&originHeight=263&originWidth=640&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=u59eff6d0-c2cd-4c56-8b86-7d9eabd3b22&title=)![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706863989469-42860754-f8f3-40f3-8acf-0ecfe5a202a8.png#averageHue=%23f0e5d3&clientId=ud5ae2333-ede6-4&from=paste&id=u91d8428f&originHeight=259&originWidth=640&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=u641d406b-a4bd-4aef-b50a-a79fd7d63d7&title=)![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706863992912-335cb2f5-06bc-4650-b227-1763b5f35c7d.png#averageHue=%23efe4d3&clientId=ud5ae2333-ede6-4&from=paste&id=u98ca43d5&originHeight=263&originWidth=640&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=uaa3ba0f0-3352-4fad-8ca5-ea562ad4829&title=)![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706863995766-b8169ac7-5fee-416f-8dc5-c1c7ed3c6f35.png#averageHue=%23f0e5d3&clientId=ud5ae2333-ede6-4&from=paste&id=u88fa7c01&originHeight=260&originWidth=640&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=u257ce3f4-be5b-458d-8d31-8e515e3b793&title=)
我们注意到，当**步幅**设置为2的时候，Feature Map就变成2*2了。这说明图像大小、步幅和卷积后的Feature Map大小是有关系的。事实上，它们满足下面的关系：
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864028432-ec8f4dde-e321-4dce-b772-ee99d6d5799f.png#averageHue=%23f1f1f1&clientId=ud5ae2333-ede6-4&from=paste&id=u01b3f3e3&originHeight=66&originWidth=334&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=ucc36c8c8-8f0a-444a-a419-937b74b7948&title=)
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864050372-c55c3d8a-4a0f-41c2-b25f-b5afff0569a5.png#averageHue=%23e9e9e9&clientId=ud5ae2333-ede6-4&from=paste&height=99&id=u0d058cc6&originHeight=124&originWidth=935&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=28231&status=done&style=none&taskId=ue220a14d-f613-46ce-bcb2-4c89330b5d7&title=&width=748)
以前面的例子来说，图像宽度W1=5，filter宽度F=3，**Zero Padding**P=0，**步幅**S=2，则
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864061808-d7e31b0c-57d5-47af-a1e0-8d893e26e59b.png#averageHue=%23f5f5f5&clientId=ud5ae2333-ede6-4&from=paste&id=u69806559&originHeight=85&originWidth=261&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=u3676b205-c3ba-4997-bac7-c4c4b19b98d&title=)
说明Feature Map宽度是2。同样，我们也可以计算出Feature Map高度也是2。
前面我们已经讲了深度为1的卷积层的计算方法，如果深度大于1怎么计算呢？其实也是类似的。如果卷积前的图像深度为D，那么相应的filter的深度也必须为D。我们扩展一下**式1**，得到了深度大于1的卷积计算公式：
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864088062-e48af36f-5149-45de-81e4-60e4dfd31e60.png#averageHue=%23f4f4f4&clientId=ud5ae2333-ede6-4&from=paste&id=uc2ffcfa5&originHeight=51&originWidth=513&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=u7a59f2cb-43e5-44a1-8d4f-e6c2678c779&title=)
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864108082-7ea26b1a-a2d6-4920-9f95-d7c1051912f6.png#averageHue=%23ececec&clientId=ud5ae2333-ede6-4&from=paste&height=67&id=ued62efe7&originHeight=84&originWidth=937&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=18163&status=done&style=none&taskId=u25979eb5-e3d8-42f0-b4e6-dfe1ce0c582&title=&width=749.6)
我们前面还曾提到，每个卷积层可以有多个filter。每个filter和原始图像进行卷积后，都可以得到一个Feature Map。因此，卷积后Feature Map的深度(个数)和卷积层的filter个数是相同的。
下面的动画显示了**包含两个filter的卷积层的计算。**我们可以看到7*7*3输入，经过两个3*3*3filter的卷积(步幅为2)，得到了3*3*2的输出。另外我们也会看到下图的**Zero padding**是1，也就是在输入元素的周围补了一圈0。**Zero padding**对于图像边缘部分的特征提取是很有帮助的。
![](https://cdn.nlark.com/yuque/0/2024/gif/40625813/1706864132996-225b8979-8342-451e-b8d1-a5f5668ceffe.gif#averageHue=%23f8f3f2&clientId=ud5ae2333-ede6-4&from=paste&id=u7498ba12&originHeight=684&originWidth=780&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=u2b72905a-dac8-4317-aa15-856c1b354af&title=)
以上就是卷积层的计算方法。这里面体现了**局部连接**和**权值共享**：每层神经元只和上一层部分神经元相连(卷积计算规则)，且filter的权值对于上一层所有神经元都是一样的。对于包含两个3*3*3的fitler的卷积层来说，其参数数量仅有(3*3*3+1)*2=56个，且参数数量与上一层神经元个数无关。与**全连接神经网络**相比，其参数数量大大减少了。
#### 用卷积公式来表达卷积层计算
不想了解太多数学细节的读者可以跳过这一节，不影响对全文的理解。
**式4**的表达很是繁冗，最好能简化一下。就像利用矩阵可以简化表达**全连接神经网络**的计算一样，我们利用**卷积公式**可以简化**卷积神经网络**的表达。
下面我们介绍**二维卷积公式**。
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864200808-78ba6401-a3bb-480d-b008-2a58fa52a04f.png#averageHue=%23eeeeee&clientId=ud5ae2333-ede6-4&from=paste&height=30&id=ue721285c&originHeight=37&originWidth=915&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=7821&status=done&style=none&taskId=u4d3adccc-8c7e-41d4-81c9-b8df40c379e&title=&width=732)
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864212730-d8fe3b8b-79d8-4d93-a347-ffd98a2c028b.png#averageHue=%23f5f5f5&clientId=ud5ae2333-ede6-4&from=paste&id=uc9911fa8&originHeight=64&originWidth=275&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=u99c001f9-0040-4c21-85a4-87d3918d023&title=)
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864231306-a7e0bc4e-2fea-44e3-965b-a3801bbe0545.png#averageHue=%23f1f1f1&clientId=ud5ae2333-ede6-4&from=paste&height=29&id=u6b691f8e&originHeight=36&originWidth=641&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=5620&status=done&style=none&taskId=u64a91f76-35aa-4f17-aebf-d97967826f1&title=&width=512.8)
我们可以把上式写成
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864247028-8d919bae-b8a7-43a5-92a4-969437a00685.png#averageHue=%23f3f3f3&clientId=ud5ae2333-ede6-4&from=paste&id=u28ddc75f&originHeight=34&originWidth=190&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=udbd5bde0-5048-4840-8635-54421c9f64a&title=)
如果我们按照**式5**来计算卷积，我们可以发现矩阵A实际上是filter，而矩阵B是待卷积的输入，位置关系也有所不同：
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864266705-9f5537a4-40d7-4b87-b130-953580061d2f.png#averageHue=%23f4e8de&clientId=ud5ae2333-ede6-4&from=paste&id=u0f9d6912&originHeight=307&originWidth=640&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=ua875a71e-231f-4adc-ab40-cda0d16c6a1&title=)
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864298735-9ea23524-263e-45a6-baec-5af1d1a0776d.png#averageHue=%23e8e8e8&clientId=ud5ae2333-ede6-4&from=paste&height=88&id=u75bbe8d2&originHeight=110&originWidth=949&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=25875&status=done&style=none&taskId=ud5168c2e-58c8-4f6d-8453-6e5be64fdc2&title=&width=759.2)
**卷积**和**互相关**操作是可以转化的。首先，我们把矩阵A翻转180度，然后再交换A和B的位置（即把B放在左边而把A放在右边。卷积满足交换率，这个操作不会导致结果变化），那么**卷积**就变成了**互相关**。
如果我们不去考虑两者这么一点点的区别，我们可以把**式5**代入到**式4**：
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864315494-6218bdde-1929-43a4-ac76-536a25761478.png#averageHue=%23f2f2f2&clientId=ud5ae2333-ede6-4&from=paste&id=u4ae6a466&originHeight=40&originWidth=340&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=u0337f070-de93-4bb1-bc84-bcaceb33494&title=)
其中，A是卷积层输出的feature map。同**式4**相比，**式6**就简单多了。然而，这种简洁写法只适合步长为1的情况。
### Pooling层输出值的计算
Pooling层主要的作用是**下采样**，通过去掉Feature Map中不重要的样本，进一步减少参数数量。Pooling的方法很多，最常用的是**Max Pooling**。**Max Pooling**实际上就是在n*n的样本中取最大值，作为采样后的样本值。下图是2*2 max pooling：
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864352743-6c82a0ab-c505-442d-9a97-b5186c6e152f.png#averageHue=%23e2d9bc&clientId=ud5ae2333-ede6-4&from=paste&id=ud40e0b96&originHeight=299&originWidth=640&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=u98b4a1ce-1a22-4249-bd1c-f40cce5b5fd&title=)
除了**Max Pooing**之外，常用的还有**Mean Pooling**——取各样本的平均值。
对于深度为D的Feature Map，各层独立做Pooling，因此Pooling后的深度仍然为D。
### 全连接层
全连接层输出值的计算和上一篇文章[深度学习实战教程(三)：神经网络和反向传播算法](https://cuijiahua.com/blog/2018/11/dl-9.html)讲过的**全连接神经网络**是一样的，这里就不再赘述了。
## 卷积神经网络的训练
和**全连接神经网络**相比，**卷积神经网络**的训练要复杂一些。但训练的原理是一样的：利用链式求导计算损失函数对每个权重的偏导数（梯度），然后根据梯度下降公式更新权重。训练算法依然是反向传播算法。
我们先回忆一下上一篇文章[深度学习实战教程(三)：神经网络和反向传播算法](https://cuijiahua.com/blog/2018/11/dl-9.html)介绍的反向传播算法，整个算法分为三个步骤：
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864408722-aeff2e1c-f07e-42b4-adf5-8342275dee7a.png#averageHue=%23efefef&clientId=ud5ae2333-ede6-4&from=paste&height=170&id=u63680deb&originHeight=213&originWidth=889&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=41481&status=done&style=none&taskId=u718953a6-eb16-4c7d-a7a8-e9cf2948fec&title=&width=711.2)
对于卷积神经网络，由于涉及到**局部连接**、**下采样**的等操作，影响到了第二步**误差项**δ的具体计算方法，而**权值共享**影响了第三步**权重**w的**梯度**的计算方法。接下来，我们分别介绍卷积层和Pooling层的训练算法。
### 卷积层的训练
对于卷积层，我们先来看看上面的第二步，即如何将**误差项**δ传递到上一层；然后再来看看第三步，即如何计算filter每个权值w的**梯度**。
#### 卷积层误差项的传递
##### 最简单情况下误差项的传递
我们先来考虑步长为1、输入的深度为1、filter个数为1的最简单的情况。
假设输入的大小为3*3，filter大小为2*2，按步长为1卷积，我们将得到2*2的**feature map**。如下图所示：
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864440299-17d1021b-d9dd-43f0-8c4a-b77c621e494b.png#averageHue=%23f2e7de&clientId=ud5ae2333-ede6-4&from=paste&id=u132a0b98&originHeight=343&originWidth=640&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=u8f25234e-a42d-41bb-a3da-e3470faad2f&title=)
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864457447-58f16b20-a888-4d11-89f7-88eac93d0b4e.png#averageHue=%23ececec&clientId=ud5ae2333-ede6-4&from=paste&height=129&id=u3c311277&originHeight=161&originWidth=954&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=36478&status=done&style=none&taskId=u7a5682f8-c0de-49ab-8b5d-709ecaaa547&title=&width=763.2)
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864466539-11b296bd-f500-4d55-9625-fb583808b144.png#averageHue=%23f1f1f1&clientId=ud5ae2333-ede6-4&from=paste&id=uc0b569bc&originHeight=63&originWidth=246&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=u8af348ab-e20a-4da8-9cf2-ba5bfba96c3&title=)
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864485494-d797fee9-e874-4e16-b02b-e1a54a80b3eb.png#averageHue=%23f4f4f4&clientId=ud5ae2333-ede6-4&from=paste&height=109&id=ubfaa1866&originHeight=136&originWidth=955&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=20238&status=done&style=none&taskId=u1e1362ea-8b89-495e-84ad-27fc570b213&title=&width=764)
根据链式求导法则：
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864494963-261acadb-79e0-41a1-8e3a-e31cf266171a.png#averageHue=%23f4f4f4&clientId=ud5ae2333-ede6-4&from=paste&id=u601f8da0&originHeight=136&originWidth=200&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=u31339a2e-9896-4917-b3ff-262777ab235&title=) 
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864528749-7bcbc681-eb5e-4806-81f7-cda0b07c2083.png#averageHue=%23f3f3f3&clientId=ud5ae2333-ede6-4&from=paste&height=54&id=uc2b1da35&originHeight=68&originWidth=704&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=8501&status=done&style=none&taskId=u98ef8dd1-28aa-4e9a-b26f-91db60f7654&title=&width=563.2)
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864544223-5f545f05-b1a9-4285-82e1-788963b8c280.png#averageHue=%23fafafa&clientId=ud5ae2333-ede6-4&from=paste&height=250&id=u053e5db0&originHeight=312&originWidth=763&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=35211&status=done&style=none&taskId=u7596d61b-3aaa-4672-ba05-a10f8125074&title=&width=610.4)
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864556954-fef0ba21-57b4-4ae3-9ae3-921c0da5b8b1.png#averageHue=%23f7f7f7&clientId=ud5ae2333-ede6-4&from=paste&height=278&id=u60c2a14d&originHeight=347&originWidth=745&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=55320&status=done&style=none&taskId=u6de10314-79b8-42a5-abd3-08631643455&title=&width=596)![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864572396-08db8320-ace2-45da-a1fe-2077df2fd9ec.png#averageHue=%23f5f5f5&clientId=ud5ae2333-ede6-4&from=paste&height=354&id=ueb8d2806&originHeight=442&originWidth=886&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=96003&status=done&style=none&taskId=ua979a1a0-c513-4c73-9f19-9a499fb93f2&title=&width=708.8)
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864588778-38a9689c-917f-44a7-9a4b-96c51fa7899a.png#averageHue=%23ececec&clientId=ud5ae2333-ede6-4&from=paste&height=66&id=u274d7591&originHeight=83&originWidth=956&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=17964&status=done&style=none&taskId=u7e12bd35-c71d-4b49-bb2b-5e8e24f5e24&title=&width=764.8)
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864593274-247201bc-00f7-4564-a2a1-34e7b671acc4.png#averageHue=%23edd2cb&clientId=ud5ae2333-ede6-4&from=paste&id=u7fec7a06&originHeight=328&originWidth=640&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=u39fcd29a-3e33-4e04-a26f-dccf49cdc60&title=)
因为**卷积**相当于将filter旋转180度的**cross-correlation**，因此上图的计算可以用卷积公式完美的表达：
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864606252-9c7927dc-a5ed-49be-b004-c2d29ae88235.png#averageHue=%23f1f1f1&clientId=ud5ae2333-ede6-4&from=paste&id=uff4630d3&originHeight=42&originWidth=134&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=u2d7d4015-de34-4564-a871-784c04693f0&title=)
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864629464-99a08d43-2d37-485b-a59a-ff9961f55b52.png#averageHue=%23efefef&clientId=ud5ae2333-ede6-4&from=paste&height=42&id=ud3e5457a&originHeight=52&originWidth=819&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=7901&status=done&style=none&taskId=u4248e2ca-6c1e-4d59-9343-1a663daded4&title=&width=655.2)
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864636243-8fca33f5-3062-4f38-862a-60350bc84750.png#averageHue=%23f3f3f3&clientId=ud5ae2333-ede6-4&from=paste&id=u3d56d8c3&originHeight=50&originWidth=261&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=ue1777c0d-9b80-4551-a908-e3c9eddc745&title=)
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864660500-92b20094-0026-4d8d-bc22-2761aef52dfa.png#averageHue=%23f8f8f8&clientId=ud5ae2333-ede6-4&from=paste&height=238&id=ua8b560df&originHeight=297&originWidth=559&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=25957&status=done&style=none&taskId=u2b284387-c596-406d-9c49-ac4e95a581c&title=&width=447.2)
将第一项和第二项组合起来，我们得到最终的公式：
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864677584-69b24723-affd-4f6f-9af3-3b42e6c57d3c.png#averageHue=%23f8f8f8&clientId=ud5ae2333-ede6-4&from=paste&id=u3a6f5f21&originHeight=182&originWidth=418&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=u58fbda89-6671-460b-8934-ed34c3137dc&title=)
也可以将**式7**写成卷积的形式：
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864690554-71cfbc8b-6fab-4ce9-971e-27b5bf5f2214.png#averageHue=%23f4f4f4&clientId=ud5ae2333-ede6-4&from=paste&id=u716a9cd8&originHeight=41&originWidth=326&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=ue1014d93-226e-4e25-b4c7-b3edcbd7f9b&title=)

![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864707585-a00bf5ae-2cca-4093-b9f2-d9d95a25e329.png#averageHue=%23f2f2f2&clientId=ud5ae2333-ede6-4&from=paste&height=62&id=u9550b093&originHeight=77&originWidth=941&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=12963&status=done&style=none&taskId=u65836aac-7eda-4b42-a41d-9b1dec43e87&title=&width=752.8)
以上就是步长为1、输入的深度为1、filter个数为1的最简单的情况，卷积层误差项传递的算法。下面我们来推导一下步长为S的情况。
##### 卷积步长为S时的误差传递
我们先来看看步长为S与步长为1的差别。
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864774435-776ffec3-43de-4a01-9878-109a4cfaa775.png#averageHue=%23f0e2d6&clientId=ud5ae2333-ede6-4&from=paste&id=u53c2f862&originHeight=702&originWidth=640&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=u353d3a5c-b508-449b-a920-d2f1aaec4c2&title=)
如上图，上面是步长为1时的卷积结果，下面是步长为2时的卷积结果。我们可以看出，因为步长为2，得到的feature map跳过了步长为1时相应的部分。因此，当我们反向计算**误差项**时，我们可以对步长为S的sensitivity map相应的位置进行补0，将其『还原』成步长为1时的sensitivity map，再用**式8**进行求解。
**输入层深度为D时的误差传递**
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864819231-de924509-cc49-4666-bdd8-5f1073b9ecf8.png#averageHue=%23ececec&clientId=ud5ae2333-ede6-4&from=paste&height=91&id=uc5412ee8&originHeight=114&originWidth=956&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=23467&status=done&style=none&taskId=u3c6086b7-7200-4ae4-8268-e1c0c79ab9b&title=&width=764.8)
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864824438-24d90d0c-7a88-4547-8ca3-66ff6e52d0ee.png#averageHue=%23f4e6e0&clientId=ud5ae2333-ede6-4&from=paste&id=uc43c36e5&originHeight=610&originWidth=640&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=ud7e70a72-dacc-4e21-8a78-cd9c8d16f53&title=)
**filter数量为N时的误差传递**
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864842738-0b75c824-b185-4712-b060-c488c0995bd7.png#averageHue=%23e8e8e8&clientId=ud5ae2333-ede6-4&from=paste&height=151&id=u054053f1&originHeight=189&originWidth=955&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=44843&status=done&style=none&taskId=u0055362c-fa0b-4bdc-8273-d1a007f673b&title=&width=764)
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864850233-af9fec72-e75d-4ce7-ba10-ab28bc94ecef.png#averageHue=%23f2f2f2&clientId=ud5ae2333-ede6-4&from=paste&id=u104056e7&originHeight=38&originWidth=376&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=ueedde548-a00a-418d-bdcb-3f3f9baafc1&title=)
以上就是卷积层误差项传递的算法，如果读者还有所困惑，可以参考后面的代码实现来理解。
#### 卷积层filter权重梯度的计算
我们要在得到第l层sensitivity map的情况下，计算filter的权重的梯度，由于卷积层是**权重共享**的，因此梯度的计算稍有不同。
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864875140-e473f434-40d6-4587-8fef-c0acaa8e3147.png#averageHue=%23f3e9e0&clientId=ud5ae2333-ede6-4&from=paste&id=u65fdc3d3&originHeight=345&originWidth=640&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=ub9302b97-ed1b-4668-8989-6b6e0ed4716&title=)
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864888405-103ac6fc-79ee-4309-88db-43631e2f58d1.png#averageHue=%23f2f2f2&clientId=ud5ae2333-ede6-4&from=paste&height=67&id=u834435b7&originHeight=84&originWidth=944&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=15229&status=done&style=none&taskId=u59bbf72c-0f96-4bfc-a455-e34b692ea72&title=&width=755.2)
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864903224-3112d2d6-8120-4197-b391-4e0d688a4042.png#averageHue=%23ececec&clientId=ud5ae2333-ede6-4&from=paste&height=70&id=u4cd3d71e&originHeight=88&originWidth=941&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=19556&status=done&style=none&taskId=u8ded134b-9d9f-485d-a881-cf1cacb8531&title=&width=752.8)
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864920943-1c438458-8313-4a94-80e1-a919d922cbcd.png#averageHue=%23f5f5f5&clientId=ud5ae2333-ede6-4&from=paste&height=418&id=ue708ed5e&originHeight=522&originWidth=928&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=115417&status=done&style=none&taskId=uaeb3c595-3e0b-4bd0-9147-68f3658c9f3&title=&width=742.4)
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864938048-d7cce85f-d13e-4a9e-ae07-998c10951546.png#averageHue=%23f8f8f8&clientId=ud5ae2333-ede6-4&from=paste&height=135&id=u85da0e2f&originHeight=169&originWidth=745&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=21868&status=done&style=none&taskId=u888d6cf1-9770-4293-a89b-2a366517937&title=&width=596)
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864958421-70db6ad9-3788-4498-9964-2ea894c74c7f.png#averageHue=%23f6f6f6&clientId=ud5ae2333-ede6-4&from=paste&height=120&id=u43817a79&originHeight=150&originWidth=942&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=19542&status=done&style=none&taskId=u62dc81d1-9cee-4436-925b-8fc01bf804a&title=&width=753.6)
也就是用sensitivity map作为卷积核，在input上进行**cross-correlation**，如下图所示：
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864969958-b8ed8127-9251-4015-981c-22f9573ab752.png#averageHue=%23f4ebe2&clientId=ud5ae2333-ede6-4&from=paste&id=u606ff17f&originHeight=328&originWidth=640&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=u41c65c45-90f0-4ad2-a70d-8b61a1f1d54&title=)
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706864987813-f062d394-2197-426f-825b-51cec812adf1.png#averageHue=%23f5f5f5&clientId=ud5ae2333-ede6-4&from=paste&height=202&id=u7f12c606&originHeight=252&originWidth=908&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=50083&status=done&style=none&taskId=u749d1418-de06-4ce6-9022-d284ddb22aa&title=&width=726.4)
也就是**偏置项**的**梯度**就是sensitivity map所有**误差项**之和。
对于步长为S的卷积层，处理方法与传递**误差项*是一样的，首先将sensitivity map『还原』成步长为1时的sensitivity map，再用上面的方法进行计算。
获得了所有的**梯度**之后，就是根据**梯度下降算法**来更新每个权重。这在前面的文章中已经反复写过，这里就不再重复了。
至此，我们已经解决了卷积层的训练问题，接下来我们看一看Pooling层的训练。
### Pooling层的训练
无论max pooling还是mean pooling，都没有需要学习的参数。因此，在**卷积神经网络**的训练中，Pooling层需要做的仅仅是将**误差项**传递到上一层，而没有**梯度**的计算。
#### Max Pooling误差项的传递
如下图，假设第l-1层大小为4*4，pooling filter大小为2*2，步长为2，这样，max pooling之后，第l层大小为2*2。假设第l层的δ值都已经计算完毕，我们现在的任务是计算第l-1层的δ值。
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706865025658-1b446404-122d-40e4-b905-50574a0a0ae5.png#averageHue=%23f5ecec&clientId=ud5ae2333-ede6-4&from=paste&id=uf0e19574&originHeight=483&originWidth=640&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=ua23fca78-ae92-43a3-8734-6a864550e37&title=)![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706865045695-8677e897-6b6d-4b24-9b86-8575ae693198.png#averageHue=%23f3f3f3&clientId=ud5ae2333-ede6-4&from=paste&height=113&id=u48e8cf71&originHeight=141&originWidth=922&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=27971&status=done&style=none&taskId=u905f92b5-a5cd-43d4-9036-3dd6633bf6d&title=&width=737.6)![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706865060469-ffcda39b-a3f8-4f9f-bc7f-b14e887a1b02.png#averageHue=%23f8f8f8&clientId=ud5ae2333-ede6-4&from=paste&height=119&id=u4f8fa4ef&originHeight=149&originWidth=945&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=15702&status=done&style=none&taskId=u113ff4d2-0c9b-477f-bab8-1f70822fff3&title=&width=756)
那么，我们不难求得下面几个偏导数：
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706865082131-dbce3304-12b5-407f-bb86-8989518f6399.png#averageHue=%23f2f2f2&clientId=ud5ae2333-ede6-4&from=paste&id=u084234f3&originHeight=271&originWidth=128&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=u0c772993-fd0c-4af0-84e7-6a9c8cae9c7&title=)
因此：
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706865107111-261f432b-19ce-4441-af77-936c85173e77.png#averageHue=%23f5f5f5&clientId=ud5ae2333-ede6-4&from=paste&id=u4fbccaa9&originHeight=158&originWidth=209&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=uf99cb72b-b934-4067-976a-78227d9e587&title=)
而：
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706865118816-81170ead-a812-4cf5-8970-cfc0f8ab3e05.png#averageHue=%23f5f5f5&clientId=ud5ae2333-ede6-4&from=paste&id=ued71b075&originHeight=456&originWidth=209&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=ua4088a5d-e162-4e8c-a285-9f566d37ea3&title=)
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706865135287-6c7c6b81-168c-494c-95de-34399c8c154b.png#averageHue=%23eeeeee&clientId=ud5ae2333-ede6-4&from=paste&height=98&id=u9b054c4e&originHeight=122&originWidth=932&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=22464&status=done&style=none&taskId=u29d6bde0-2c2e-4c3c-8f1f-a7562ce22c0&title=&width=745.6)
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706865139528-2e0817d6-c707-4f23-8344-32f0da112665.png#averageHue=%23f5ecec&clientId=ud5ae2333-ede6-4&from=paste&id=u70c0525f&originHeight=478&originWidth=640&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=ud514775c-37bd-47a2-852b-3db8734a0fe&title=)
#### Mean Pooling误差项的传递
我们还是用前面屡试不爽的套路，先研究一个特殊的情形，再扩展为一般规律。
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706865149966-d6e12cc7-f908-4d69-a834-6aea989a9806.png#averageHue=%23f5ecec&clientId=ud5ae2333-ede6-4&from=paste&id=uca7b2c55&originHeight=483&originWidth=640&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=u60b41fd9-750a-45cc-b533-165f512c58f&title=)
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706865163629-105cdc70-e77c-479e-9dcd-4ee8f9e06e14.png#averageHue=%23f2f2f2&clientId=ud5ae2333-ede6-4&from=paste&height=80&id=u4625dd77&originHeight=100&originWidth=694&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=17353&status=done&style=none&taskId=u48c536f3-72aa-4e9b-96e4-8281b9953c9&title=&width=555.2)
根据上式，我们一眼就能看出来：
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706865176531-385e65b5-8ec4-4a24-9946-e32001f8326d.png#averageHue=%23f1f1f1&clientId=ud5ae2333-ede6-4&from=paste&id=ua5e2d53d&originHeight=207&originWidth=106&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=u051a6e8a-1ac3-4221-9fa8-f4673ab7028&title=)
所以，根据链式求导法则，我们不难算出：
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706865192696-40fb2a14-b33b-422b-808e-ef0aec68d2f6.png#averageHue=%23f6f6f6&clientId=ud5ae2333-ede6-4&from=paste&id=u69a00b92&originHeight=181&originWidth=209&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=u69370d28-cd63-4fcd-b1fc-1f3cfdc40e4&title=)
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706865202674-ae7d7d33-ff63-40c3-a44b-139447d00b7f.png#averageHue=%23f0f0f0&clientId=ud5ae2333-ede6-4&from=paste&height=39&id=u41e5a64c&originHeight=49&originWidth=383&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=4186&status=done&style=none&taskId=u1f9cdf11-3cd4-4445-bfaf-2ff649561c5&title=&width=306.4)
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706865207843-f7c34b0a-27d9-44e1-9260-ae0398401e5e.png#averageHue=%23f5f5f5&clientId=ud5ae2333-ede6-4&from=paste&id=ua3d2cb2b&originHeight=522&originWidth=209&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=uaaad42dc-7eb9-4a28-864a-c3fc39381bc&title=)
现在，我们发现了规律：对于mean pooling，下一层的**误差项**的值会**平均分配**到上一层对应区块中的所有神经元。如下图所示：
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706865220138-cd7146e6-64e3-478b-b478-c5f186f2abd6.png#averageHue=%23f5edec&clientId=ud5ae2333-ede6-4&from=paste&id=u7d112acd&originHeight=480&originWidth=640&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=uf4015cac-a217-445c-a757-ced2960a8cd&title=)
上面这个算法可以表达为高大上的**克罗内克积(Kronecker product)**的形式，有兴趣的读者可以研究一下。
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706865235697-283237ce-72b2-4f86-8324-d1e08553bfb8.png#averageHue=%23f4f4f4&clientId=ud5ae2333-ede6-4&from=paste&id=ue96bb0a0&originHeight=38&originWidth=191&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=u516b67d1-65e6-4393-bccb-94d5443937d&title=)
![image.png](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706865248530-fced48e8-a705-4bce-ba6b-8742da4e410e.png#averageHue=%23f0f0f0&clientId=ud5ae2333-ede6-4&from=paste&height=36&id=u0c390e46&originHeight=45&originWidth=549&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=4682&status=done&style=none&taskId=uc9b003fa-557a-4097-a1fb-fc4fe223603&title=&width=439.2)
至此，我们已经把**卷积层**、**Pooling层**的训练算法介绍完毕，加上上一篇文章讲的**全连接层**训练算法，您应该已经具备了编写**卷积神经网络**代码所需要的知识。为了加深对知识的理解，接下来，我们将展示如何实现一个简单的**卷积神经网络**。
## 卷积神经网络的实现
完整代码请参考GitHub：[点击查看](https://github.com/Jack-Cherish/Deep-Learning/tree/master/Tutorial/lesson-4)
现在，我们亲自动手实现一个卷积神经网络，以便巩固我们所学的知识。
首先，我们要改变一下代码的架构，『层』成为了我们最核心的组件。这是因为卷积神经网络有不同的层，而每种层的算法都在对应的类中实现。
这次，我们用到了在python中编写算法经常会用到的**numpy**包。为了使用**numpy**，我们需要先将**numpy**导入：
```python
import numpy as np
```
### 卷积层的实现
#### 卷积层初始化
我们用**ConvLayer**类来实现一个卷积层。下面的代码是初始化一个卷积层，可以在构造函数中设置卷积层的**超参数**。
```python
class ConvLayer(object):
    def __init__(self, input_width, input_height, 
                 channel_number, filter_width, 
                 filter_height, filter_number, 
                 zero_padding, stride, activator,
                 learning_rate):
        self.input_width = input_width
        self.input_height = input_height
        self.channel_number = channel_number
        self.filter_width = filter_width
        self.filter_height = filter_height
        self.filter_number = filter_number
        self.zero_padding = zero_padding
        self.stride = stride
        self.output_width = \
            ConvLayer.calculate_output_size(
            self.input_width, filter_width, zero_padding,
            stride)
        self.output_height = \
            ConvLayer.calculate_output_size(
            self.input_height, filter_height, zero_padding,
            stride)
        self.output_array = np.zeros((self.filter_number, 
            self.output_height, self.output_width))
        self.filters = []
        for i in range(filter_number):
            self.filters.append(Filter(filter_width, 
                filter_height, self.channel_number))
        self.activator = activator
        self.learning_rate = learning_rate
```
**calculate_output_size**函数用来确定卷积层输出的大小，其实现如下：
```python
    @staticmethod
    def calculate_output_size(input_size,
            filter_size, zero_padding, stride):
        return int((input_size - filter_size + 
            2 * zero_padding) / stride + 1)
```
**Filter**类保存了卷积层的**参数**以及**梯度**，并且实现了用**梯度下降算法**来更新参数。
```python
class Filter(object):
    def __init__(self, width, height, depth):
        self.weights = np.random.uniform(-1e-4, 1e-4,
            (depth, height, width))
        self.bias = 0
        self.weights_grad = np.zeros(
            self.weights.shape)
        self.bias_grad = 0

    def __repr__(self):
        return 'filter weights:\n%s\nbias:\n%s' % (
            repr(self.weights), repr(self.bias))

    def get_weights(self):
        return self.weights

    def get_bias(self):
        return self.bias

    def update(self, learning_rate):
        self.weights -= learning_rate * self.weights_grad
        self.bias -= learning_rate * self.bias_grad
```
我们对参数的初始化采用了常用的策略，即：**权重**随机初始化为一个很小的值，而**偏置项**初始化为0。
**Activator**类实现了**激活函数**，其中，**forward**方法实现了前向计算，而**backward**方法则是计算**导数**。比如，relu函数的实现如下：
```python
class ReluActivator(object):
    def forward(self, weighted_input):
        #return weighted_input
        return max(0, weighted_input)

    def backward(self, output):
        return 1 if output > 0 else 0
```
#### 卷积层前向计算的实现
**ConvLayer**类的**forward**方法实现了卷积层的前向计算（即计算根据输入来计算卷积层的输出），下面是代码实现：
```python
    def forward(self, input_array):
        '''
        计算卷积层的输出
        输出结果保存在self.output_array
        '''
        self.input_array = input_array
        self.padded_input_array = padding(input_array,
            self.zero_padding)
        for f in range(self.filter_number):
            filter = self.filters[f]
            conv(self.padded_input_array, 
                filter.get_weights(), self.output_array[f],
                self.stride, filter.get_bias())
        element_wise_op(self.output_array, 
                        self.activator.forward)
```
上面的代码里面包含了几个工具函数。**element_wise_op**函数实现了对**numpy**数组进行**按元素**操作，并将返回值写回到数组中，代码如下：
```python
# 对numpy数组进行element wise操作
def element_wise_op(array, op):
    for i in np.nditer(array,
                       op_flags=['readwrite']):
        i[...] = op(i)

```
**conv**函数实现了2维和3维数组的**卷积**，代码如下：
```python
# 计算卷积
def conv(input_array, 
         kernel_array,
         output_array, 
         stride, bias):
    '''
    计算卷积，自动适配输入为2D和3D的情况
    '''
    channel_number = input_array.ndim
    output_width = output_array.shape[1]
    output_height = output_array.shape[0]
    kernel_width = kernel_array.shape[-1]
    kernel_height = kernel_array.shape[-2]
    for i in range(output_height):
        for j in range(output_width):
            output_array[i][j] = (    
                get_patch(input_array, i, j, kernel_width, 
                    kernel_height, stride) * kernel_array
                ).sum() + bias
```
**padding**函数实现了zero padding操作：
```python
# 为数组增加Zero padding
def padding(input_array, zp):
    '''
    为数组增加Zero padding，自动适配输入为2D和3D的情况
    '''
    if zp == 0:
        return input_array
    else:
        if input_array.ndim == 3:
            input_width = input_array.shape[2]
            input_height = input_array.shape[1]
            input_depth = input_array.shape[0]
            padded_array = np.zeros((
                input_depth, 
                input_height + 2 * zp,
                input_width + 2 * zp))
            padded_array[:,
                zp : zp + input_height,
                zp : zp + input_width] = input_array
            return padded_array
        elif input_array.ndim == 2:
            input_width = input_array.shape[1]
            input_height = input_array.shape[0]
            padded_array = np.zeros((
                input_height + 2 * zp,
                input_width + 2 * zp))
            padded_array[zp : zp + input_height,
                zp : zp + input_width] = input_array
            return padded_array

```
#### 卷积层反向传播算法的实现
现在，是介绍卷积层核心算法的时候了。我们知道反向传播算法需要完成几个任务：

1. 将**误差项**传递到上一层。
2. 计算每个**参数**的**梯度**。
3. 更新**参数**。

以下代码都是在**ConvLayer**类中实现。我们先来看看将**误差项**传递到上一层的代码实现。
```python
    def bp_sensitivity_map(self, sensitivity_array,
                           activator):
        '''
        计算传递到上一层的sensitivity map
        sensitivity_array: 本层的sensitivity map
        activator: 上一层的激活函数
        '''
        # 处理卷积步长，对原始sensitivity map进行扩展
        expanded_array = self.expand_sensitivity_map(
            sensitivity_array)
        # full卷积，对sensitivitiy map进行zero padding
        # 虽然原始输入的zero padding单元也会获得残差
        # 但这个残差不需要继续向上传递，因此就不计算了
        expanded_width = expanded_array.shape[2]
        zp = int((self.input_width +  
              self.filter_width - 1 - expanded_width) / 2)
        padded_array = padding(expanded_array, zp)
        # 初始化delta_array，用于保存传递到上一层的
        # sensitivity map
        self.delta_array = self.create_delta_array()
        # 对于具有多个filter的卷积层来说，最终传递到上一层的
        # sensitivity map相当于所有的filter的
        # sensitivity map之和
        for f in range(self.filter_number):
            filter = self.filters[f]
            # 将filter权重翻转180度
            flipped_weights = np.array(list(map(
                lambda i: np.rot90(i, 2), 
                filter.get_weights())))
            # 计算与一个filter对应的delta_array
            delta_array = self.create_delta_array()
            for d in range(delta_array.shape[0]):
                conv(padded_array[f], flipped_weights[d],delta_array[d], 1, 0)
            self.delta_array += delta_array
        # 将计算结果与激活函数的偏导数做element-wise乘法操作
        derivative_array = np.array(self.input_array)
        element_wise_op(derivative_array, 
                        activator.backward)
        self.delta_array *= derivative_array
```
**expand_sensitivity_map**方法就是将步长为S的sensitivity map『还原』为步长为1的sensitivity map，代码如下：
```python
    def expand_sensitivity_map(self, sensitivity_array):
        depth = sensitivity_array.shape[0]
        # 确定扩展后sensitivity map的大小
        # 计算stride为1时sensitivity map的大小
        expanded_width = (self.input_width - 
            self.filter_width + 2 * self.zero_padding + 1)
        expanded_height = (self.input_height - 
            self.filter_height + 2 * self.zero_padding + 1)
        # 构建新的sensitivity_map
        expand_array = np.zeros((depth, expanded_height, 
                                 expanded_width))
        # 从原始sensitivity map拷贝误差值
        for i in range(self.output_height):
            for j in range(self.output_width):
                i_pos = i * self.stride
                j_pos = j * self.stride
                expand_array[:,i_pos,j_pos] = \
                    sensitivity_array[:,i,j]
        return expand_array

```
	**create_delta_array**是创建用来保存传递到上一层的sensitivity map的数组。
```python
    def create_delta_array(self):
        return np.zeros((self.channel_number,
            self.input_height, self.input_width))
```
接下来，是计算梯度的代码。
```python
    def bp_gradient(self, sensitivity_array):
        # 处理卷积步长，对原始sensitivity map进行扩展
        expanded_array = self.expand_sensitivity_map(
            sensitivity_array)
        for f in range(self.filter_number):
            # 计算每个权重的梯度
            filter = self.filters[f]
            for d in range(filter.weights.shape[0]):
                conv(self.padded_input_array[d], 
                     expanded_array[f],
                     filter.weights_grad[d], 1, 0)
            # 计算偏置项的梯度
            filter.bias_grad = expanded_array[f].sum()
```
最后，是按照**梯度下降算法**更新参数的代码，这部分非常简单。
```python
    def update(self):
        '''
        按照梯度下降，更新权重
        '''
        for filter in self.filters:
            filter.update(self.learning_rate)
```
#### 卷积层的梯度检查
为了验证我们的公式推导和代码实现的正确性，我们必须要对卷积层进行梯度检查。下面是代吗实现：
```python
def init_test():
    a = np.array(
        [[[0,1,1,0,2],
          [2,2,2,2,1],
          [1,0,0,2,0],
          [0,1,1,0,0],
          [1,2,0,0,2]],
         [[1,0,2,2,0],
          [0,0,0,2,0],
          [1,2,1,2,1],
          [1,0,0,0,0],
          [1,2,1,1,1]],
         [[2,1,2,0,0],
          [1,0,0,1,0],
          [0,2,1,0,1],
          [0,1,2,2,2],
          [2,1,0,0,1]]])
    b = np.array(
        [[[0,1,1],
          [2,2,2],
          [1,0,0]],
         [[1,0,2],
          [0,0,0],
          [1,2,1]]])
    cl = ConvLayer(5,5,3,3,3,2,1,2,IdentityActivator(),0.001)
    cl.filters[0].weights = np.array(
        [[[-1,1,0],
          [0,1,0],
          [0,1,1]],
         [[-1,-1,0],
          [0,0,0],
          [0,-1,0]],
         [[0,0,-1],
          [0,1,0],
          [1,-1,-1]]], dtype=np.float64)
    cl.filters[0].bias=1
    cl.filters[1].weights = np.array(
        [[[1,1,-1],
          [-1,-1,1],
          [0,-1,1]],
         [[0,1,0],
         [-1,0,-1],
          [-1,1,0]],
         [[-1,0,0],
          [-1,0,1],
          [-1,0,0]]], dtype=np.float64)
    return a, b, cl
```
上面代码值得思考的地方在于，传递给卷积层的sensitivity map是全1数组，留给读者自己推导一下为什么是这样（提示：激活函数选择了identity函数：f(x)=x。
在cmd运行上面梯度检查的代码，我们得到的输出如下，期望的梯度和实际计算出的梯度一致，这证明我们的算法推导和代码实现确实是正确的。
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706865594356-3d0d85fd-5e78-4efc-b3d1-eb2501e9abc6.png#averageHue=%23242424&clientId=ud5ae2333-ede6-4&from=paste&id=u9e7e7a37&originHeight=481&originWidth=538&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=ucca526ad-ab47-4b4b-b62c-bb36f8dab5a&title=)
以上就是卷积层的实现。
### Max Pooling层的实现
max pooling层的实现相对简单，我们直接贴出全部代码如下：
```python
class MaxPoolingLayer(object):
    def __init__(self, input_width, input_height, 
                 channel_number, filter_width, 
                 filter_height, stride):
        self.input_width = input_width
        self.input_height = input_height
        self.channel_number = channel_number
        self.filter_width = filter_width
        self.filter_height = filter_height
        self.stride = stride
        self.output_width = int((input_width - 
            filter_width) / self.stride + 1)
        self.output_height = int((input_height -
            filter_height) / self.stride + 1)
        self.output_array = np.zeros((self.channel_number,
            self.output_height, self.output_width))

    def forward(self, input_array):
        for d in range(self.channel_number):
            for i in range(self.output_height):
                for j in range(self.output_width):
                    self.output_array[d,i,j] = (    
                        get_patch(input_array[d], i, j,
                            self.filter_width, 
                            self.filter_height, 
                            self.stride).max())

    def backward(self, input_array, sensitivity_array):
        self.delta_array = np.zeros(input_array.shape)
        for d in range(self.channel_number):
            for i in range(self.output_height):
                for j in range(self.output_width):
                    patch_array = get_patch(
                        input_array[d], i, j,
                        self.filter_width, 
                        self.filter_height, 
                        self.stride)
                    k, l = get_max_index(patch_array)
                    self.delta_array[d, 
                        i * self.stride + k, 
                        j * self.stride + l] = \
                        sensitivity_array[d,i,j]
```
全连接层的实现和上一篇文章类似，在此就不再赘述了。至此，你已经拥有了实现了一个简单的**卷积神经网络**所需要的基本组件。对于**卷积神经网络**，现在有很多优秀的开源实现，因此我们并不需要真的自己去实现一个。贴出这些代码的目的是为了让我们更好的了解**卷积神经网络**的基本原理。
## 卷积神经网络的应用
### MNIST手写数字识别
LeNet-5是实现手写数字识别的**卷积神经网络**，在MNIST测试集上，它取得了0.8%的错误率。LeNet-5的结构如下：
![](https://cdn.nlark.com/yuque/0/2024/png/40625813/1706865687391-651028f6-4e67-4001-9ae9-85b17dabe7f0.png#averageHue=%23d7d6d6&clientId=ud5ae2333-ede6-4&from=paste&id=uc050cd1d&originHeight=300&originWidth=1096&originalType=url&ratio=1.25&rotation=0&showTitle=false&status=done&style=none&taskId=ubdfbf97d-aaea-40c8-9162-13fe1d3baae&title=)
关于LeNet-5的详细介绍，可以看我的文章[网络解析（一）：LeNet-5详解](https://cuijiahua.com/blog/2018/01/dl_3.html)。感兴趣的读者可以尝试用我们自己实现的卷积神经网络代码去构造并训练LeNet-5（当然代码会更复杂一些）。
## 小节
由于**卷积神经网络**的复杂性，我们写出了整个系列目前为止最长的一篇文章，相信读者也和作者一样累的要死。**卷积神经网络**是深度学习最重要的工具（我犹豫要不要写上『之一』呢），付出一些辛苦去理解它也是值得的。如果您真正理解了本文的内容，相当于迈过了入门深度学习最重要的一到门槛。在下一篇文章中，我们介绍深度学习另外一种非常重要的工具：**循环神经网络**，届时我们的系列文章也将完成过半。每篇文章都是一个过滤器，对于坚持到这里的读者们，入门深度学习曙光已现，加油。
## 参考资料

1. [CS231n Convolutional Neural Networks for Visual Recognition](http://cs231n.github.io/convolutional-networks/)
2. [ReLu (Rectified Linear Units) 激活函数](http://www.mamicode.com/info-detail-873243.html)
3. Jake Bouvrie, Notes on Convolutional Neural Networks, 2006
4. [Ian Goodfellow, Yoshua Bengio, Aaron Courville, Deep Learning, MIT Press, 2016](http://www.deeplearningbook.org/)

原文链接：[https://www.zybuluo.com/hanbingtao/note/485480](https://www.zybuluo.com/hanbingtao/note/485480)
