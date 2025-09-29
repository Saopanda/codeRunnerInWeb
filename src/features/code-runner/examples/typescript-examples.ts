// TypeScript 示例代码

export const typescriptExamples = {
  basic: `// 基本类型注解
function greet(name: string): string {
  return "Hello, " + name + "!";
}

const message: string = greet("TypeScript");
console.log(message);`,

  simple: `// 简单测试
console.log("TypeScript 编译测试");
const num: number = 42;
const str: string = "Hello World";
console.log("数字:", num);
console.log("字符串:", str);`,

  interfaces: `// 接口定义
interface User {
  id: number;
  name: string;
  email?: string; // 可选属性
}

interface Admin extends User {
  permissions: string[];
}

const admin: Admin = {
  id: 1,
  name: "管理员",
  email: "admin@example.com",
  permissions: ["read", "write", "delete"]
};

console.log("用户信息:", admin);`,

  generics: `// 泛型示例
function identity<T>(arg: T): T {
  return arg;
}

function getArrayLength<T>(arr: T[]): number {
  return arr.length;
}

const numbers: number[] = [1, 2, 3, 4, 5];
const strings: string[] = ["a", "b", "c"];

console.log("数字:", identity(42));
console.log("字符串:", identity("TypeScript"));
console.log("数组长度:", getArrayLength(numbers));`,

  classes: `// 类定义
class Animal {
  protected name: string;
  
  constructor(name: string) {
    this.name = name;
  }
  
  speak(): string {
    return this.name + " makes a sound";
  }
}

class Dog extends Animal {
  private breed: string;
  
  constructor(name: string, breed: string) {
    super(name);
    this.breed = breed;
  }
  
  speak(): string {
    return this.name + " barks";
  }
  
  getInfo(): string {
    return this.name + " is a " + this.breed;
  }
}

const dog = new Dog("Buddy", "Golden Retriever");
console.log(dog.speak());
console.log(dog.getInfo());`,

  async: `// 异步函数和 Promise
async function fetchData(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // 使用安全的延迟函数
    const timer = setTimeout(() => {
      resolve("Data from " + url);
    }, 500); // 缩短延迟时间
    
    // 模拟可能的错误
    if (url.includes("error")) {
      clearTimeout(timer);
      reject(new Error("模拟网络错误"));
    }
  });
}

async function main() {
  try {
    console.log("开始获取数据...");
    const data = await fetchData("https://api.example.com");
    console.log("获取到数据:", data);
  } catch (error) {
    console.error("错误:", error.message);
  }
}

main();`,

  errorHandling: `// 错误处理示例
function divide(a: number, b: number): number | never {
  if (b === 0) {
    throw new Error("除数不能为零");
  }
  return a / b;
}

try {
  const result = divide(10, 2);
  console.log("结果:", result);
  
  const invalidResult = divide(10, 0);
} catch (error) {
  console.error("捕获到错误:", error.message);
}`
};
