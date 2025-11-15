## 规约算法

refer:  https://developer.download.nvidia.com/assets/cuda/files/reduction.pdf

```cuda

#include <stdio.h>
#include <cuda_runtime.h>

__global__ void reduction(int *input, int *output, int n) {
  extern __shared__ int s_data[];
  int tid = blockDim.x * blockIdx.x + threadIdx.x;

  // Load data into shared memory
  if (tid < n) {
    s_data[threadIdx.x] = input[tid];
  } else {
    s_data[threadIdx.x] = 0;  // Initialize out-of-bounds elements to 0
  }
  __syncthreads(); // synchronize data for all threads in block

  // Start reduction for block
  // stride = 2
  // 1 2 3 4
  // 3 2 7 4
  // 10 2 7 4
  for (int i = 1; i < blockDim.x; i *= 2) {
    // TODO: divergent !!!!
    if (threadIdx.x % (2 * i) == 0) {
      if (threadIdx.x + i < blockDim.x) {
        s_data[threadIdx.x] += s_data[threadIdx.x + i];
      }
    }
    __syncthreads();
  }

  // Write result using atomic operation to avoid race condition
  if (threadIdx.x == 0) {
    atomicAdd(output, s_data[0]);
  }
}

int main() {
  int n = 1000;
  int *a = new int[n];
  int *b = new int();
  for (int i = 0; i < n; i++) {
    a[i] = i;
  }
  int *d_a, *d_b;
  cudaError_t err;

  err = cudaMalloc(&d_a, n * sizeof(int));
  if (err != cudaSuccess) {
    printf("cudaMalloc failed for d_a: %s\n", cudaGetErrorString(err));
    return 1;
  }

  err = cudaMalloc(&d_b, sizeof(int));
  if (err != cudaSuccess) {
    printf("cudaMalloc failed for d_b: %s\n", cudaGetErrorString(err));
    return 1;
  }

  // Initialize output to 0
  int zero = 0;
  cudaMemcpy(d_b, &zero, sizeof(int), cudaMemcpyHostToDevice);

  cudaMemcpy(d_a, a, n * sizeof(int), cudaMemcpyHostToDevice);

  // Calculate block size and shared memory size
  int block_size = (n + 127) / 128;
  int shared_mem_size = block_size * sizeof(int);

  reduction<<<128, block_size, shared_mem_size>>>(d_a, d_b, n);

  err = cudaGetLastError();
  if (err != cudaSuccess) {
    printf("Kernel launch failed: %s\n", cudaGetErrorString(err));
    return 1;
  }

  cudaDeviceSynchronize();

  err = cudaGetLastError();
  if (err != cudaSuccess) {
    printf("Kernel execution failed: %s\n", cudaGetErrorString(err));
    return 1;
  }
  cudaMemcpy(b, d_b, sizeof(int), cudaMemcpyDeviceToHost);
  // check the result
  printf("The result is %d\n", *b);
  // check the result is correct
  int sum = 0;
  for (int i = 0; i < n; i++) {
    sum += a[i];
  }
  printf("The correct result is %d\n", sum);
  if (*b == sum) {
    printf("The result is correct\n");
  } else {
    printf("The result is incorrect\n");
  }
  cudaFree(d_a);
  cudaFree(d_b);
  delete[] a;
  delete b;
  return 0;
}



```
