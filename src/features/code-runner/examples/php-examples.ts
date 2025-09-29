export const phpExamples = {
  simple: `<?php
echo "Hello PHP!";
echo "\n欢迎使用 PHP 脚本运行器！\n";

// 变量和数据类型
$name = "PHP";
$version = 8.1;
$isAwesome = true;

echo "语言: " . $name . "\n";
echo "版本: " . $version . "\n";
echo "很棒: " . ($isAwesome ? "是" : "否") . "\n";
?>`,

  basic: `<?php
// 基础 PHP 语法演示

// 变量
$greeting = "Hello";
$name = "World";
$number = 42;
$pi = 3.14159;
$isTrue = true;

// 字符串连接
echo $greeting . " " . $name . "!\n";

// 数学运算
echo "数字: " . $number . "\n";
echo "π 值: " . $pi . "\n";
echo "计算: " . ($number * 2) . "\n";

// 条件语句
if ($isTrue) {
    echo "条件为真\n";
} else {
    echo "条件为假\n";
}

// 循环
echo "循环输出:\n";
for ($i = 1; $i <= 3; $i++) {
    echo "第 " . $i . " 次\n";
}
?>`,

  functions: `<?php
// PHP 函数示例

function greet($name) {
    return "Hello, " . $name . "!";
}

function add($a, $b) {
    return $a + $b;
}

function factorial($n) {
    if ($n <= 1) {
        return 1;
    }
    return $n * factorial($n - 1);
}

// 调用函数
echo greet("PHP") . "\n";
echo "5 + 3 = " . add(5, 3) . "\n";
echo "5! = " . factorial(5) . "\n";

// 匿名函数
$multiply = function($x, $y) {
    return $x * $y;
};

echo "4 × 6 = " . $multiply(4, 6) . "\n";
?>`,

  arrays: `<?php
// PHP 数组操作

// 索引数组
$fruits = ["苹果", "香蕉", "橙子", "葡萄"];
echo "水果列表:\n";
foreach ($fruits as $index => $fruit) {
    echo ($index + 1) . ". " . $fruit . "\n";
}

// 关联数组
$person = [
    "name" => "张三",
    "age" => 25,
    "city" => "北京"
];

echo "\n个人信息:\n";
foreach ($person as $key => $value) {
    echo $key . ": " . $value . "\n";
}

// 数组函数
echo "\n数组操作:\n";
echo "水果数量: " . count($fruits) . "\n";
echo "第一个水果: " . $fruits[0] . "\n";
echo "最后一个水果: " . end($fruits) . "\n";

// 添加元素
array_push($fruits, "草莓");
echo "添加草莓后: " . implode(", ", $fruits) . "\n";
?>`,

  classes: `<?php
// PHP 面向对象编程

class Car {
    private $brand;
    private $model;
    private $year;

    public function __construct($brand, $model, $year) {
        $this->brand = $brand;
        $this->model = $model;
        $this->year = $year;
    }

    public function getInfo() {
        return $this->year . " " . $this->brand . " " . $this->model;
    }

    public function start() {
        return "启动 " . $this->brand . " " . $this->model;
    }

    public function getBrand() {
        return $this->brand;
    }
}

// 继承
class ElectricCar extends Car {
    private $batteryLife;

    public function __construct($brand, $model, $year, $batteryLife) {
        parent::__construct($brand, $model, $year);
        $this->batteryLife = $batteryLife;
    }

    public function charge() {
        return "正在充电，续航: " . $this->batteryLife . "km";
    }
}

// 使用类
$car1 = new Car("丰田", "卡罗拉", 2023);
echo $car1->getInfo() . "\n";
echo $car1->start() . "\n";

$car2 = new ElectricCar("特斯拉", "Model 3", 2023, 500);
echo $car2->getInfo() . "\n";
echo $car2->charge() . "\n";
?>`,

  errorHandling: `<?php
// PHP 错误处理

function divide($a, $b) {
    if ($b == 0) {
        throw new Exception("除数不能为零");
    }
    return $a / $b;
}

function processData($data) {
    if (!is_array($data)) {
        throw new InvalidArgumentException("参数必须是数组");
    }

    if (empty($data)) {
        throw new Exception("数组不能为空");
    }

    return array_sum($data) / count($data);
}

// 错误处理示例
echo "错误处理演示:\n\n";

// 示例 1: 除零错误
try {
    echo "10 ÷ 2 = " . divide(10, 2) . "\n";
    echo "10 ÷ 0 = " . divide(10, 0) . "\n";
} catch (Exception $e) {
    echo "捕获错误: " . $e->getMessage() . "\n";
}

// 示例 2: 数据处理错误
try {
    $numbers = [1, 2, 3, 4, 5];
    echo "平均值: " . processData($numbers) . "\n";

    $emptyArray = [];
    echo "空数组平均值: " . processData($emptyArray) . "\n";
} catch (InvalidArgumentException $e) {
    echo "参数错误: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "处理错误: " . $e->getMessage() . "\n";
}

echo "程序继续执行\n";
?>`,
}
