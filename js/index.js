var sw=20,	//一个方块的宽度
	sh=20,	//一个方块的高度
	tr=30,	//行数
	td=30;	//列数

var snake=null,	//蛇的实例
	food=null,	//食物的实例
	game=null;	//游戏的实例	

//一、方块构造函数
//给原型上添加属性
function Square(x,y,classname){
	//0,0		0,0
	//20,0		1,0
	//40,0		2,0

	this.x=x*sw;//用户传的坐标*方块的宽度，将用户传进来的参数用构造函数的属性存一下
	this.y=y*sh;
	this.class=classname;//classname没有大写，因为他是变量不是div身上的属性

	this.viewContent=document.createElement('div');	//每个方块对应的DOM元素
	//因为网页听不懂小方块，把它换成div，后面的dom操作都是对viewContent的操作
	this.viewContent.className=this.class;	
	this.parent=document.getElementById('snakeWrap');//获取方块的父级，即方块要添给谁
}
//给Square原型上添加方法
//1.添加dom元素并且给它添加样式
Square.prototype.create=function(){	//创建方块DOM，并添加到页面里
	//给方块添加样式
	this.viewContent.style.position='absolute';
	this.viewContent.style.width=sw+'px';
	this.viewContent.style.height=sh+'px';
	this.viewContent.style.left=this.x+'px';
	this.viewContent.style.top=this.y+'px';//此时的方块还没有到页面中，需要appendChild

	this.parent.appendChild(this.viewContent);
};
//2.删除dom元素
Square.prototype.remove=function(){
	this.parent.removeChild(this.viewContent);
};

//二、创建蛇，它的属性
function Snake(){
	this.head=null;	//存一下蛇头的信息。声明属性，但是并没有值
	this.tail=null;	//存一下蛇尾的信息
	//移动时只移动了蛇头和蛇尾
	this.pos=[];	//存储蛇身上的每一个方块的位置，便于位置对比，二维数组

	this.directionNum={	//存储蛇走的方向，用一个对象来表示
		//按键对应的方位
		left:{
			x:-1,
			y:0,
			rotate:180	//蛇头在不同的方向中应该进行旋转，要不始终是向右（更改蛇头位置）
		},
		right:{
			x:1,
			y:0,
			rotate:0
		},
		up:{
			x:0,
			y:-1,
			rotate:-90
		},
		down:{
			x:0,
			y:1,
			rotate:90
		}
	}
}
//三、给构造函数snake上添加方法
Snake.prototype.init=function(){
	//创建蛇头
	var snakeHead=new Square(2,0,'snakeHead');
	//创建了一个蛇头，它仅仅是一个对象，肯定有一个对应的dom元素，要把它显示在页面中，还需要creat方法
	snakeHead.create();
	this.head=snakeHead;	//更新蛇头信息（上面是null），存储蛇头信息
	this.pos.push([2,0]);	//把蛇头的位置存起来

	//创建蛇身体1
	var snakeBody1=new Square(1,0,'snakeBody');
	snakeBody1.create();
	this.pos.push([1,0]);	//把蛇身1的坐标也存起来

	//创建蛇身体2
	var snakeBody2=new Square(0,0,'snakeBody');
	snakeBody2.create();
	this.tail=snakeBody2;	//把蛇尾的信息存起来，蛇尾信息更新
	this.pos.push([0,0]);	//把蛇身1的坐标也存起来

	//形成链表关系，目的是把蛇作为一个整体在动（每个方块和前后都有关系）
	snakeHead.last=null;
	snakeHead.next=snakeBody1;

	snakeBody1.last=snakeHead;
	snakeBody1.next=snakeBody2;

	snakeBody2.last=snakeBody1;
	snakeBody2.next=null;

	//给蛇添加一条属性，用来表示蛇走的方向
	this.direction=this.directionNum.right;	//默认让蛇往右走
};

//四、添加方法：走完之后接下来要做什么事情很重要——接下来走到的方块是个啥
//这个方法用来获取蛇头的下一个位置对应的元素，要根据元素做不同的事情
Snake.prototype.getNextPos=function(){
	var nextPos=[	//蛇头要走的下一个点的坐标（蛇头当前的位置以及哪个方向会+1或者-1）
		this.head.x/sw+this.direction.x,
		this.head.y/sh+this.direction.y
	]
	//下个点的情况：
	//1、下个点是自己，代表撞到了自己，游戏结束
	var selfCollied=false;	//声明变量来决定是否撞到了自己，默认不是
	this.pos.forEach(function(value){ 
		//数组遍历，value表示数组中的某一项，即二维数组里面的一维数组，即某个位置
		if(value[0]==nextPos[0] && value[1]==nextPos[1]){
			//某一项即某个位置value的x,y与下一项某个位置value的x,y相等
			//value[0]表示某一点的x坐标，value[1]表示某一点的y坐标
			//如果数组中的两个数据都相等，就说明下一个点在蛇身上里面能找到，代表撞到自己了
			selfCollied=true;
		}
	});
	if(selfCollied){
		console.log('撞到自己了！');
		
		//this.strategies.die() 这样的话die方法的this就指向调用它的对象，即this.strategies
		//此时在die方法里面不能用this.head来获取实例的属性，所以用call来让this指向实例snake
		this.strategies.die.call(this);//这个this在原型的方法中，它指向的就是实例对象snake

		return;
	}

	//2、下个点是围墙，游戏结束
	if(nextPos[0]<0 || nextPos[1]<0 || nextPos[0]>td-1 || nextPos[1]>tr-1){
		console.log('撞墙了！');

		this.strategies.die.call(this);

		return;
	}

	//3、下个点是食物，吃
	if(food && food.pos[0]==nextPos[0] && food.pos[1]==nextPos[1]){
		//如果这个条件成立说明现在蛇头要走的下一个点是食物的那个点
		console.log('撞到食物了！');
		this.strategies.eat.call(this);
		return;
	}
	//

	//4、下个点什么都不是，走
	this.strategies.move.call(this);
};

//五、
//处理碰撞后要做的事
//在原型上添加一个属性，蛇在移动过程中有三个情况：移动，吃，死
Snake.prototype.strategies={
	move:function(format){	//这个参数用于决定要不要删除最后一个方块（蛇尾）。当传了这个参数后就表示要做的事情是吃
		//创建新身体（在旧蛇头的位置）
		var newBody=new Square(this.head.x/sw,this.head.y/sh,'snakeBody');
		//改变了元素的位置，则要更新链表的关系，在this.head移除之前，找到关系并且更新
		newBody.next=this.head.next;
		newBody.next.last=newBody;//newBody和newBody.next.last的相互关系确定
		newBody.last=null;

		this.head.remove();	//把旧蛇头从原来的位置删除
		newBody.create(); //把新身体添上

		//创建一个新蛇头(蛇头下一个要走到的点nextPos，上面计算过)
		var newHead=new Square(this.head.x/sw+this.direction.x,this.head.y/sh+this.direction.y,'snakeHead');
		//更新链表的关系
		newHead.next=newBody;
		newHead.last=null;
		newBody.last=newHead;//newHead和newBody的相互关系确定
		newHead.viewContent.style.transform='rotate('+this.direction.rotate+'deg)';//添加蛇头换角度的属性
		newHead.create();

		//蛇身上的每一个方块的坐标也要更新
		//只需要在newhead上给它插入一个值，因为newbody和之前的head是相等的
		this.pos.splice(0,0,[this.head.x/sw+this.direction.x,this.head.y/sh+this.direction.y]);
		this.head=newHead;	//还要把this.head的信息更新一下


		if(!format){	//如果fromat的值为false，表示需要删除（除了吃之外的操作）
			this.tail.remove();
			this.tail=this.tail.last;

			this.pos.pop();
		}
	},
	eat:function(){
		this.strategies.move.call(this,true);//formate的值为true（不删）；call的作用把this指向实例对象
		createFood();
		game.score++;
	},
	die:function(){
		//console.log('die');
		game.over();
	}
}
snake=new Snake();



//创建食物
function createFood(){
	//食物小方块的随机坐标
	var x=null;
	var y=null;

	var include=true;	//循环跳出的条件，true表示食物的坐标在蛇身上（需要继续循环）。false表示食物的坐标不在蛇身上（不循环了）
	while(include){ //如果食物在蛇的身上，继续循环，一直到不在蛇身上为止
		x=Math.round(Math.random()*(td-1));//从0-29随机数的公式
		y=Math.round(Math.random()*(tr-1));
		//修改include的值
		snake.pos.forEach(function(value){
			if(x!=value[0] && y!=value[1]){
				//这个条件成立说明现在随机出来的这个坐标，在蛇身上并没有找到。
				include=false;
			}
		});
	}

	//生成食物（通过Square来创建）
	food=new Square(x,y,'food');
	food.pos=[x,y];	//存储一下生成食物的坐标，用于跟蛇头要走的下一个点做对比

	var foodDom=document.querySelector('.food');
	if(foodDom){
		foodDom.style.left=x*sw+'px';
		foodDom.style.top=y*sh+'px';
	}else{
		food.create();
	}
}
//createFood();移到下面


//创建游戏逻辑，控制游戏，为玩家提供操作方法
function Game(){
	this.timer=null;
	this.score=0;
}
Game.prototype.init=function(){
	snake.init();
	//snake.getNextPos();
	createFood();
	//键盘事件
	document.onkeydown=function(ev){
		if(ev.which==37 && snake.direction!=snake.directionNum.right){	//用户按下左键的时候，同时这条蛇不能是正在往右走
			snake.direction=snake.directionNum.left;
		}else if(ev.which==38 && snake.direction!=snake.directionNum.down){
			snake.direction=snake.directionNum.up;
		}else if(ev.which==39 && snake.direction!=snake.directionNum.left){
			snake.direction=snake.directionNum.right;
		}else if(ev.which==40 && snake.direction!=snake.directionNum.up){
			snake.direction=snake.directionNum.down;
		}
	}

	this.start();//让他走
}
Game.prototype.start=function(){	//开始游戏
	this.timer=setInterval(function(){
		snake.getNextPos();
	},200);
}
Game.prototype.pause=function(){
	clearInterval(this.timer);
}
Game.prototype.over=function(){
	clearInterval(this.timer);
	alert('你的得分为：'+this.score);

	//游戏回到最初始的状态
	var snakeWrap=document.getElementById('snakeWrap');
	snakeWrap.innerHTML='';

	snake=new Snake();
	game=new Game()

	var startBtnWrap=document.querySelector('.startBtn');
	startBtnWrap.style.display='block';
}


//开启游戏
game=new Game();
var startBtn=document.querySelector('.startBtn button');
startBtn.onclick=function(){
	startBtn.parentNode.style.display='none';
	game.init();
};

//暂停
var snakeWrap=document.getElementById('snakeWrap');
var pauseBtn=document.querySelector('.pauseBtn button');
snakeWrap.onclick=function(){
	game.pause();

	pauseBtn.parentNode.style.display='block';
}

pauseBtn.onclick=function(){
	game.start();
	pauseBtn.parentNode.style.display='none';
}



