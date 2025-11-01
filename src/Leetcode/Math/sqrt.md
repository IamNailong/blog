Given a non-negative integer x, return the square root of x rounded down to the nearest integer. The returned integer should be non-negative as well.

You must not use any built-in exponent function or operator.

For example, do not use pow(x, 0.5) in c++ or x ** 0.5 in python.


Example 1:

Input: x = 4
Output: 2
Explanation: The square root of 4 is 2, so we return 2.
Example 2:

Input: x = 8
Output: 2
Explanation: The square root of 8 is 2.82842..., and since we round it down to the nearest integer, 2 is returned.

```cpp
class Solution {
public:
    int mySqrt(int x) {
        // 特殊情况处理
        if (x == 0) {
            return 0;
        }

        // 搜索区间为 [1, x]
        // 也可以是 [0, x]，但 [1, x] 在 x > 0 时更紧凑
        int left = 1;
        int right = x;
        int ans = 0; // 用来存储最后一个满足 mid*mid <= x 的 mid

        while (left <= right) {
            // 使用 (right - left) / 2 来防止 (left + right) 溢出
            int mid = left + (right - left) / 2;

            // 关键：使用除法来避免 mid * mid 溢出
            // 检查 mid 是否 <= x / mid (等价于 mid*mid <= x)
            if (mid <= x / mid) {
                // mid 是一个可能的解
                // 因为我们要找最大的r，所以我们保存这个解，并尝试向右搜索
                ans = mid;
                left = mid + 1;
            } else {
                // mid * mid > x，说明 mid 太大了，需要向左搜索
                right = mid - 1;
            }
        }

        return ans;
    }
};
```
