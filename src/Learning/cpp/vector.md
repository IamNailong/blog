## 实现一个c++ vector

```cpp

#include <cstddef>
#include <iostream>
#include <stdexcept>

template <typename T> class Vector {
private:
  T *data;
  size_t size;
  size_t capacity;

public:
  Vector() {
    data = new T[1];
    size = 0;
    capacity = 1;
  }

  ~Vector() { delete[] data; }

  void resize(size_t new_capacity) {
    T *new_data = new T[new_capacity];
    for (int i = 0; i < size; i++) {
      new_data[i] = data[i];
    }
    delete[] data;
    data = new_data;
    capacity = new_capacity;
  }

  void push_back(T value) {
    if (size == capacity) {
      capacity *= 2;
      T *new_data = new T[capacity];
      for (size_t i = 0; i < size; i++) {
        new_data[i] = data[i];
      }
      delete[] data;
      data = new_data;
    }
    data[size++] = value;
  }

  T &operator[](size_t index) {
    if (index >= size) {
      throw std::out_of_range("Index out of range");
    }
    return data[index];
  }

  void pop_back() {
    if (size == 0) {
      throw std::out_of_range("Vector is empty");
    }
    size--;
  }
};

int main() {
  Vector<int> vec;
  vec.push_back(1);
  vec.push_back(2);
  vec.push_back(3);
  std::cout << vec[0] << std::endl;
  std::cout << vec[1] << std::endl;
  std::cout << vec[2] << std::endl;
  vec.pop_back();
  std::cout << vec[2] << std::endl;
  return 0;
}
```
