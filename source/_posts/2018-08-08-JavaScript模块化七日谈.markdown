---
layout:     post
title:      "JavaScript 模块化七日谈"
date:       2018-08-08
author:     "Vincent"
catalog:    true
tags:
    - 前端开发
    - JavaScript
    - 前端模块化
---

> 黄玄这篇 Slides（[JavaScript Modularization Journey](https://huangxuan.me/js-module-7day)）把前端模块化的发展历程梳理的很清晰，这篇文章是对这个 Slides 的总结。

### 第一日 上古时期 (MODULE?)

> 从设计模式说起

最早，我们这么写代码：

```js
function foo(){
    //...
}
function bar(){
    //...
}
```

这种情况下 Global 被污染，很容易命名冲突。

于是想到了进行简单的封装，就是 **Namespace** 模式：

```js
var MYAPP = {
    foo: function(){},
    bar: function(){}
}

MYAPP.foo();
```

这种做法减少 Global 上的变量数目。

但是它本质是对象，我们可以直接访问甚至更改它的内部变量，一点都不安全。由此就有了用匿名闭包的方式，即 **IIFE** 模式：

```js
var Module = (function(){
    var _private = "safe now";
    var foo = function(){
        console.log(_private)
    }

    return {
        foo: foo
    }
})()

Module.foo();
Module._private; // undefined
```

再增强一点，引入依赖：

```js
var Module = (function($){
    var _$body = $("body");     // we can use jQuery now!
    var foo = function(){
        console.log(_$body);    // 特权方法
    }

    // Revelation Pattern
    return {
        foo: foo
    }
})(jQuery)

Module.foo();
```

这就是模块模式，也是现代模块实现的基石。

### 第二日 石器时代 (SCRIPT LOADER)

>只有封装性可不够，我们还需要加载

回到 script 标签：

```js
body
    script(src="jquery.js")
    script(src="app.js")    // do some $ things...
```

请求是必要发起的，加载是平行加载，DOM 顺序即执行顺序。

对于一个前端项目，现实是这样的：

```js
body
    script(src="zepto.js")
    script(src="jhash.js")
    script(src="fastClick.js")
    script(src="iScroll.js")
    script(src="underscore.js")
    script(src="handlebar.js")
    script(src="datacenter.js")
    script(src="deferred.js")
    script(src="util/wxbridge.js")
    script(src="util/login.js")
    script(src="util/base.js")
    script(src="util/city.js")
    script(src="util/date.js")
    script(src="util/cookie.js")
    script(src="app.js")
```

这就引发了难以维护、依赖模糊、请求过多的问题。

#### [LABjs](http://labjs.com/)

```js
script(src="LAB.js")
```

```js
$LAB.script("framework.js").wait()
    .script("plugin.framework.js")
    .script("myplugin.framework.js").wait()
    .script("init.js");
```

.wait()方法表示立即运行刚才加载的Javascript文件

语法糖：

```js
$LAB
.script( [ "script1.js", "script2.js", "script3.js"] )
.wait(function(){ // wait for all scripts to execute first
    script1Func();
    script2Func();
    script3Func();
});
```

*基于文件的依赖管理*

### 第三日 蒸汽朋克 (MODULE LOADER)

> 模块化架构的工业革命

#### [YUI3](https://huangxuan.me/js-module-7day/yuilibrary.com) Loader

回顾昔日王者的风采：

```js
// YUI - 编写模块
YUI.add('dom', function(Y) {
  Y.DOM = { ... }
})

// YUI - 使用模块
YUI().use('dom', function(Y) {
  Y.DOM.doSomeThing();
  // use some methods DOM attach to Y
})
```

编写常用模块：

```js
// hello.js
YUI.add('hello', function(Y){
    Y.sayHello = function(msg){
        Y.DOM.set(el, 'innerHTML', 'Hello!');
    }
},'3.0.0',{
    requires:['dom']
})
```

```js
// main.js
YUI().use('hello', function(Y){
    Y.sayHello("hey yui loader");
})
```

*基于模块的依赖管理*

更深一步：

```js
// Sandbox Implementation
function Sandbox() {
    // ...
    // initialize the required modules
    for (i = 0; i < modules.length; i += 1) {
        Sandbox.modules[modules[i]](this);
    }
    // ...
}
```

Y 其实是一个强沙箱，所有依赖模块通过 attach 的方式被注入沙盒。

> attach：在当前 YUI 实例上执行模块的初始化代码，使得模块在当前实例上可用

YUI Combo 可以解决过多网络请求的问题：

```js
script(src="http://yui.yahooapis.com/3.0.0/build/yui/yui-min.js")
script(src="http://yui.yahooapis.com/3.0.0/build/dom/dom-min.js")
```

上面的情况可以写成：

```js
script(src="http://yui.yahooapis.com/combo?
    3.0.0/build/yui/yui-min.js&
    3.0.0/build/dom/dom-min.js")
```

这样就能在一次请求中拿到多个资源

*GET 请求，需要服务器支持*

### 第四日 号角吹响 (COMMONJS)

> 征服世界的第一步是跳出浏览器

#### [CommonJS](http://www.commonjs.org/) - API Standard

CommonJS 前身叫 ServerJS ，后来希望能更加 COMMON，成为通吃各种环境的模块规范，改名为 CommonJS 。

**Modules/1.x**

模块的定义与引用：

```js
// math.js
exports.add = function(a, b){
    return a + b;
}
```

```js
// main.js
var math = require('math')      // ./math in node
console.log(math.add(1, 2));    // 3
```

CommonJS 最初只专注于 Server-side 而非浏览器环境，因此它采用了同步/阻塞式加载的机制：

```js
// timeout.js
var EXE_TIME = 2;

(function(second){
    var start = +new Date();
    while(start + second*1000 > new Date()){}
})(EXE_TIME)

console.log("2000ms executed")
```

```js
// main.js
require('./timeout');   // sync load
console.log('done!');
```

这对服务器环境（硬盘 I/O 速度）不是问题，而对浏览器环境（网速）来说并不合适。

### 第五日 双塔奇兵 (AMD/CMD)

> 浏览器环境模块化方案

在 CommonJS 推广到浏览器的过程中，关于 Modules 的下一版规范，形成了三大流派：

1. Modules/1.x 流派。这个观点觉得 1.x 规范已经够用，只要移植到浏览器端就好。要做的是新增 Modules/Transport 规范，即在浏览器上运行前，先通过转换工具将模块转换为符合 Transport 规范的代码。主流代表是服务端的开发人员。
2. Modules/Async 流派。这个观点觉得浏览器有自身的特征，不应该直接用 Modules/1.x 规范。这个观点下的典型代表是 AMD 规范及其实现 RequireJS。
3. Modules/2.0 流派。这个观点觉得浏览器有自身的特征，不应该直接用 Modules/1.x 规范，但应该尽可能与 Modules/1.x 规范保持一致。这个观点下的典型代表是 BravoJS 和 FlyScript 的作者。这个观点在本文中的典型代表就是 SeaJS 和 CMD 了。

#### [RequireJS](http://requirejs.org/) & AMD

AMD (Async Module Definition) 是 RequireJS 在推广过程中对模块定义的规范化产出。

RequireJS 主要解决的还是 CommonJS 同步加载脚本不适合浏览器这个问题：

```js
//CommonJS

var Employee = require("types/Employee");

function Programmer (){
    //do something
}  

Programmer.prototype = new Employee();

//如果 require call 是异步的，那么肯定 error
//因为在执行这句前 Employee 模块肯定来不及加载进来
```

所以我们需要 Function Wrapping 来获取依赖并且提前通过 script tag 提前加载进来

```js
//AMD Wrapper

define(
    [types/Employee],    //依赖
    function(Employee){  //这个回调会在所有依赖都被加载后才执行

        function Programmer(){
            //do something
        };

        Programmer.prototype = new Employee();
        return Programmer;  //return Constructor
    }
)
```

当依赖模块非常多时，这种依赖前置的写法会显得有点奇怪，所以 AMD 给了一个语法糖， simplified CommonJS wrapping，借鉴了 CommonJS 的 require 就近风格，也更方便对 CommonJS 模块的兼容：

```js
define(function (require) {
    var dependency1 = require('dependency1'),
        dependency2 = require('dependency2');

    return function () {};
});
```

AMD 和 CommonJS 的核心争议包括执行时机和书写风格：

**执行时机**

Modules/1.0:

```js
var a = require("./a") // 执行到此时，a.js 才同步下载并执行
```

AMD: （使用 require 的语法糖时）

```js
define(["require"],function(require)){
    // 在这里，a.js 已经下载并且执行好了
    // 使用 require() 并不是 AMD 的推荐写法
    var a = require("./a") // 此处仅仅是取模块 a 的 exports
})
```

AMD 里提前下载 a.js 是出于对浏览器环境的考虑，只能采取异步下载，这个社区都认可（Sea.js 也是这么做的）

但是 AMD 的执行是提前执行，而 Modules/1.0 是第一次 require 时才执行。这个差异很多人不能接受，包括持 Modules/2.0 观点的人也不能接受。

**书写风格**

AMD 推荐的风格并不使用require，而是通过参数传入，破坏了依赖就近：

```js
define(["a", "b", "c"],function(a, b, c){
    // 提前申明了并初始化了所有模块

    true || b.foo(); //即便根本没用到模块 b，但 b 还是提前执行了。
})
```

#### [SeaJS](https://seajs.github.io/seajs/docs/) & CMD

CMD (Common Module Definition) 是 SeaJS 在推广过程中对模块定义的规范化产出，是 Modules/2.0 流派的支持者，因此 SeaJS 的模块写法尽可能与 Modules/1.x 规范保持一致。

CMD 主要有 define, factory, require, export 这么几个东西：

- define `define(id?, deps?, factory)`
- factory `factory(require, exports, module)`
- require `require(id)`
- exports `Object`

CMD 推荐的 Code Style 是使用 CommonJS 风格的 require：

这个 require 实际上是一个全局函数，用于加载模块，这里实际就是传入而已

```js
define(function(require, exports) {

    // 获取模块 a 的接口
    var a = require('./a');
    // 调用模块 a 的方法
    a.doSomething();

    // 对外提供 foo 属性
    exports.foo = 'bar';
    // 对外提供 doSomething 方法
    exports.doSomething = function() {};

});
```

但是你也可以使用 AMD 风格，或者使用 return 来进行模块暴露

```js
define('hello', ['jquery'], function(require, exports, module) {

    // 模块代码...

    // 直接通过 return 暴露接口
    return {
        foo: 'bar',
        doSomething: function() {}
    };

});
```

Sea.js 借鉴了 RequireJS 的不少东西，比如将 FlyScript 中的 module.declare 改名为 define 等。Sea.js 更多地来自 Modules/2.0 的观点，但尽可能去掉了学院派的东西，加入了不少实战派的理念。

#### AMD vs CMD

虽然两者目前都兼容各种风格，但其底层原理并不相同，从其分别推荐的写法就可以看出两者背后原理的不同：

对于依赖的模块，AMD 是提前执行，CMD 是懒执行；CMD 推崇依赖就近，AMD 推崇依赖前置。（都是先加载）

看代码：

```js
// AMD 默认推荐

define(['./a', './b'], function(a, b) {  // 依赖前置，提前执行

    a.doSomething()
    b.doSomething()

})
```

```js
// CMD

define(function(require, exports, module) {

    var a = require('./a')
    a.doSomething()

    var b = require('./b') // 依赖就近，延迟执行
    b.doSomething()
})
```

### 第六日 精灵宝钻 (BROWSERIFY/WEBPACK)

> 大势所趋，去掉这层包裹！

#### [Browserify](http://browserify.org/) - CommonJS In Browser

Browserify 是一个 node.js 模块，主要用于改写现有的 CommonJS 模块，使得浏览器端也可以使用这些模块。

举个例子，假定有一个很简单的CommonJS模块文件foo.js：

```js
// foo.js

module.exports = function(x) {
  console.log(x);
};
```

然后，还有一个main.js文件，用来加载foo模块：

```js
// main.js

var foo = require("./foo");
foo("Hi");
```

使用Browserify，将main.js转化为浏览器可以加载的脚本compiled.js。

```shell
browserify main.js -o compiled.js
```

转化后的文件不仅包括了main.js，还包括了它所依赖的foo.js。两者打包在一起，保证浏览器加载时的依赖关系。

```html
<script src="compiled.js"></script>
```

使用上面的命令，在浏览器中运行 compiled.js，控制台会显示Hi。

利用 [Watchify](https://www.npmjs.com/package/watchify) 可以做到 auto-recompile：

```shell
$ npm install -g watchify
```

```shell
# WATCH!
$ watchify app.js -o bundle.js -v
```

#### [Webpack](https://www.webpackjs.com/) - Module Bundler

webpack 是一个模块打包器，webpack 的主要目标是将 JavaScript 文件打包在一起，打包后的文件用于在浏览器中使用。

webpack 功能十分强大，除了打包 JS 还能对静态资源、css 文件等进行处理，另外还有插件系统、代码分割等功能。

### 第七日 王者归来 (ES6 MODULE)

> 最后的战役

在 ES6 之后终于有了 Module

只有一个 default 的情况：

```js
// math.js
export default math = {
    PI: 3.14,
    foo: function(){}
}
```

```js
// app.js
import math from "./math";
math.PI
```

命名 export：

```js
// export Declaration
export function foo(){
    console.log('I am not bar.');
}
```

```js
// export VariableStatement;
export var PI = 3.14;
export var bar = foo;   // function expression
```

```js
// export { ExportsList }
var PI = 3.14;
var foo = function(){};

export { PI, foo };
```

引入命名的 export：

```js
// import { ImportsList } from "module-name"
import { PI } from "./math";
import { PI, foo } from "module-name";
```

```js
// import IdentifierName as ImportedBinding
import { foo as bar } from "./math";
bar();  // use alias bar
```

```js
// import NameSpaceImport
import * as math from "./math";
math.PI
math.foo()
```

#### [babel](https://babeljs.io/)

Babel 是一个 JavaScript 编译器，它让我们现在就可以使用下一代 JavaScript 语法。

> 参考：
> [前端模块的历史沿革](https://www.cyj.me/programming/2018/05/22/about-module-i/)
> [前端模块的现状](https://www.cyj.me/programming/2018/05/23/about-module-ii/)
