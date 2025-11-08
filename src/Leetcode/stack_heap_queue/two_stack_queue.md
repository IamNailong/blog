source : https://www.nowcoder.com/practice/54275ddae22f475981afa2244dd448c6?tpId=295&tqId=23281&sourceUrl=%2Fexam%2Foj%3FquestionJobId%3D10%26subTabName%3Donline_coding_page

详细解析
我们准备两个栈：stackIn (入队栈) 和 stackOut (出队栈)。

1. 核心职责分配
stackIn (入队栈): 只负责接收所有新加入队列的元素 (Enqueue操作)。

stackOut (出队栈): 只负责提供所有离开队列的元素 (Dequeue操作)。

2. 操作流程
🚀 入队 (Enqueue) 操作

这个操作非常简单：当需要向队列中添加一个元素时，始终将其 push (压入) 到 stackIn。

示例： 依次 enqueue(1), enqueue(2), enqueue(3)

stackIn 的状态 (栈顶在右侧)： [1, 2, 3]

stackOut 的状态： [] (空的)

🚢 出队 (Dequeue) 操作

这是实现 FIFO 的关键。我们想取出的是 1 (最早进入的元素)。

检查 stackOut：

如果 stackOut 不为空： 这意味着栈顶元素就是下一个要出队的元素。直接 pop (弹出) stackOut 的栈顶元素即可。

如果 stackOut 为空： 这是关键一步。

“倒水”操作 (当 stackOut 为空时)：

将 stackIn 中的所有元素依次 pop 出来，并 push 到 stackOut 中。

继续上面的示例：

stackIn 为 [1, 2, 3] (3在栈顶)

pop 3 从 stackIn，push 到 stackOut -> stackOut 变为 [3]

pop 2 从 stackIn，push 到 stackOut -> stackOut 变为 [3, 2]

pop 1 从 stackIn，push 到 stackOut -> stackOut 变为 [3, 2, 1]

操作完成后的状态：

stackIn：[] (空的)

stackOut (栈顶在右侧)：[3, 2, 1]

从 stackOut 取出元素：

现在，stackOut 的栈顶元素是 1，这正是我们最先 enqueue 的元素。

pop stackOut 的栈顶 1，将其返回。

3. 核心思想总结
stackIn 就像是队列的“入口”。元素进入 stackIn，顺序被反转了一次（后进的在顶部）。

当需要取出元素时，我们将 stackIn 的所有内容“倾倒”进 stackOut，这个“倾倒”过程又反转了一次顺序。

两次反转（一次入 stackIn，一次入 stackOut）使得元素的顺序变回了“先进先出”，stackOut 的栈顶永远是当前队列中最早进入的元素。

```cpp
#include <stack>
#include <stdexcept> // 用于抛出异常

class Solution {
  public:
    void push(int node) {
        // push 操作永远不变，始终是 O(1)
        stackIn.push(node);
    }

    int pop() {
        // 1. 检查 stackOut。如果为空，才从 stackIn“进货”
        if (stackOut.empty()) {
            while (!stackIn.empty()) {
                stackOut.push(stackIn.top());
                stackIn.pop();
            }
        }

        // 2. 此时（进货完毕后）再次检查
        // 如果 stackOut 仍然为空，说明整个队列都是空的
        if (stackOut.empty()) {
            // 这是一个错误情况：试图从空队列中pop
            // 严谨的做法是抛出异常
            throw std::runtime_error("Error: Pop from an empty queue.");
            // 或者根据题目要求返回一个特定的错误值，比如 -1
            // return -1;
        }

        // 3. 队列非空，安全地从 stackOut 弹出
        int res = stackOut.top();
        stackOut.pop();
        return res;
    }

  private:
    std::stack<int> stackIn;  // 只负责进
    std::stack<int> stackOut; // 只负责出
};

```
