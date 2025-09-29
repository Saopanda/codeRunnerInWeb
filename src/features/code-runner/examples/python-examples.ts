export const pythonExamples = {
  'python-basic': `# Python基础语法示例
print("Hello, World!")
print("欢迎使用Python代码运行器！")

# 变量和数据类型
name = "Python"
version = 3.11
is_awesome = True

print(f"语言: {name}")
print(f"版本: {version}")
print(f"是否很棒: {is_awesome}")

# 列表操作
numbers = [1, 2, 3, 4, 5]
print(f"数字列表: {numbers}")
print(f"列表长度: {len(numbers)}")
print(f"第一个元素: {numbers[0]}")
print(f"最后一个元素: {numbers[-1]}")

# 字典操作
person = {
    "name": "张三",
    "age": 25,
    "city": "北京"
}
print(f"个人信息: {person}")
print(f"姓名: {person['name']}")`,

  'python-functions': `# 函数定义
def greet(name, age=None):
    """问候函数"""
    if age:
        return f"你好, {name}! 你今年{age}岁。"
    else:
        return f"你好, {name}!"

# 调用函数
print(greet("小明"))
print(greet("小红", 20))

# 类定义
class Calculator:
    def __init__(self):
        self.history = []
    
    def add(self, a, b):
        result = a + b
        self.history.append(f"{a} + {b} = {result}")
        return result
    
    def multiply(self, a, b):
        result = a * b
        self.history.append(f"{a} × {b} = {result}")
        return result
    
    def get_history(self):
        return self.history

# 使用类
calc = Calculator()
print(f"5 + 3 = {calc.add(5, 3)}")
print(f"4 × 6 = {calc.multiply(4, 6)}")
print("计算历史:")
for record in calc.get_history():
    print(f"  {record}")`,

  'python-math': `# 数学计算示例
import math
import random

# 基本数学运算
a, b = 10, 3
print(f"基本运算:")
print(f"{a} + {b} = {a + b}")
print(f"{a} - {b} = {a - b}")
print(f"{a} × {b} = {a * b}")
print(f"{a} ÷ {b} = {a / b}")
print(f"{a} 的 {b} 次方 = {a ** b}")
print(f"{a} 除以 {b} 的余数 = {a % b}")

# 数学函数
print(f"\n数学函数:")
print(f"π = {math.pi}")
print(f"e = {math.e}")
print(f"√{a} = {math.sqrt(a)}")
print(f"log({a}) = {math.log(a)}")
print(f"sin(π/2) = {math.sin(math.pi/2)}")
print(f"cos(0) = {math.cos(0)}")

# 随机数
print(f"\n随机数:")
print(f"随机整数 (1-100): {random.randint(1, 100)}")
print(f"随机浮点数 (0-1): {random.random():.4f}")
print(f"随机选择: {random.choice(['苹果', '香蕉', '橙子'])}")

# 列表推导式
squares = [x**2 for x in range(1, 11)]
print(f"\n平方数列表: {squares}")

# 斐波那契数列
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(f"\n斐波那契数列前10项:")
for i in range(10):
    print(f"F({i}) = {fibonacci(i)}")`,

  'python-strings': `# 字符串处理示例
import re

# 基本字符串操作
text = "  Hello, World!  "
print(f"原始字符串: '{text}'")
print(f"去除空格: '{text.strip()}'")
print(f"转大写: '{text.upper()}'")
print(f"转小写: '{text.lower()}'")
print(f"替换: '{text.replace('World', 'Python')}'")
print(f"分割: {text.split(',')}")

# 字符串格式化
name = "小明"
age = 25
print(f"\n字符串格式化:")
print(f"姓名: {name}, 年龄: {age}")
print("姓名: {}, 年龄: {}".format(name, age))
print("姓名: %s, 年龄: %d" % (name, age))

# 正则表达式
email = "user@example.com"
phone = "138-1234-5678"
text_with_numbers = "我有3个苹果和5个橙子"

print(f"\n正则表达式:")
print(f"邮箱: {email}")
print(f"是否匹配邮箱格式: {bool(re.match(r'^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$', email))}")

print(f"手机号: {phone}")
print(f"是否匹配手机格式: {bool(re.match(r'^1[3-9]\\d-\\d{4}-\\d{4}$', phone))}")

# 提取数字
numbers = re.findall(r'\\d+', text_with_numbers)
print(f"文本中的数字: {numbers}")

# 字符串方法
sentence = "Python is awesome and Python is powerful"
print(f"\n字符串方法:")
print(f"包含'Python': {sentence.count('Python')}")
print(f"找到'awesome'位置: {sentence.find('awesome')}")
print(f"以'Python'开始: {sentence.startswith('Python')}")
print(f"以'powerful'结束: {sentence.endswith('powerful')}")`,

  'python-data-science': `# 数据分析示例
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

# 创建示例数据
data = {
    '姓名': ['张三', '李四', '王五', '赵六', '钱七'],
    '年龄': [25, 30, 35, 28, 32],
    '工资': [5000, 8000, 12000, 6000, 9500],
    '部门': ['技术', '销售', '技术', '人事', '销售']
}

# 创建DataFrame
df = pd.DataFrame(data)
print("原始数据:")
print(df)

# 基本统计信息
print("\n基本统计信息:")
dept_stats = df.groupby('部门').agg({
    '年龄': 'mean',
    '工资': ['mean', 'count']
}).round(2)
print(dept_stats)

# 筛选数据
print("\n技术部门员工:")
tech_employees = df[df['部门'] == '技术']
print(tech_employees)

# 计算平均工资
avg_salary = df['工资'].mean()
print(f"\n平均工资: {avg_salary:.2f}元")`,

  'python-matplotlib': `# 数据可视化示例
import matplotlib.pyplot as plt
import numpy as np

# 创建示例数据
x = np.linspace(0, 10, 100)
y1 = np.sin(x)
y2 = np.cos(x)
y3 = np.sin(x) * np.cos(x)

# 创建子图
fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(10, 8))

# 第一个子图：正弦和余弦函数
ax1.plot(x, y1, label='sin(x)', color='blue')
ax1.plot(x, y2, label='cos(x)', color='red')
ax1.set_title('三角函数图像')
ax1.set_xlabel('x')
ax1.set_ylabel('y')
ax1.legend()
ax1.grid(True)

# 第二个子图：散点图
np.random.seed(42)
x_scatter = np.random.randn(50)
y_scatter = 2 * x_scatter + np.random.randn(50)
ax2.scatter(x_scatter, y_scatter, alpha=0.6, color='green')
ax2.set_title('散点图示例')
ax2.set_xlabel('X')
ax2.set_ylabel('Y')
ax2.grid(True)

# 调整布局
plt.tight_layout()

# 显示图表
plt.show()

print("图表已生成！")`,

  'python-error-handling': `# 异常处理示例
import sys

# 基本异常处理
def safe_divide(a, b):
    try:
        result = a / b
        return result
    except ZeroDivisionError:
        print("错误: 除数不能为零!")
        return None
    except TypeError:
        print("错误: 参数类型不正确!")
        return None
    except Exception as e:
        print(f"未知错误: {e}")
        return None

# 测试异常处理
print("异常处理测试:")
print(f"10 ÷ 2 = {safe_divide(10, 2)}")
print(f"10 ÷ 0 = {safe_divide(10, 0)}")
print(f"10 ÷ 'a' = {safe_divide(10, 'a')}")

# 自定义异常
class CustomError(Exception):
    def __init__(self, message):
        self.message = message
        super().__init__(self.message)

def validate_age(age):
    if not isinstance(age, int):
        raise TypeError("年龄必须是整数")
    if age < 0:
        raise ValueError("年龄不能为负数")
    if age > 150:
        raise CustomError("年龄不能超过150岁")
    return True

# 测试自定义异常
test_ages = [25, -5, 200, "25", 0]

print(f"\n年龄验证测试:")
for age in test_ages:
    try:
        validate_age(age)
        print(f"年龄 {age}: 有效")
    except TypeError as e:
        print(f"年龄 {age}: 类型错误 - {e}")
    except ValueError as e:
        print(f"年龄 {age}: 值错误 - {e}")
    except CustomError as e:
        print(f"年龄 {age}: 自定义错误 - {e}")

# finally子句
def file_operation():
    try:
        print("执行文件操作...")
        # 模拟文件操作
        raise FileNotFoundError("文件不存在")
    except FileNotFoundError as e:
        print(f"文件错误: {e}")
    finally:
        print("清理资源...")

print(f"\nfinally子句示例:")
file_operation()`,
}
