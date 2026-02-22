class ZenosRunner extends Phaser.Scene {

constructor(){
super("ZenosRunner");

this.totalDistance = 1000;
this.remainingDistance = 1000;
this.layer = 0;
this.seriesSum = 0;
this.speed = 260;
this.transitioning = false;
this.maxLayers = 25;
}

create(){

this.createBackground();
this.createRunner();
this.createHUD();
this.createObstacles();
this.createGoal();

this.input.on("pointerdown", this.jump, this);
}

createBackground(){

this.starsFar = this.add.tileSprite(0,0,this.scale.width,this.scale.height,"")
.setOrigin(0);

this.starGraphics = this.add.graphics();
for(let i=0;i<200;i++){
this.starGraphics.fillStyle(0x00ffff, Phaser.Math.FloatBetween(0.2,0.8));
this.starGraphics.fillCircle(
Phaser.Math.Between(0,this.scale.width),
Phaser.Math.Between(0,this.scale.height),
Phaser.Math.Between(1,2)
);
}

this.starGraphics2 = this.add.graphics();
for(let i=0;i<100;i++){
this.starGraphics2.fillStyle(0xff00ff, Phaser.Math.FloatBetween(0.3,0.9));
this.starGraphics2.fillCircle(
Phaser.Math.Between(0,this.scale.width),
Phaser.Math.Between(0,this.scale.height),
Phaser.Math.Between(1,3)
);
}
}

createRunner(){

let g = this.add.graphics();
g.fillStyle(0x00ffff);
g.fillRoundedRect(-15,-30,30,60,10);
g.generateTexture("runner",30,60);
g.destroy();

this.runner = this.physics.add.sprite(150,this.scale.height-120,"runner");
this.runner.body.setGravityY(900);
this.runner.setCollideWorldBounds(true);

this.ground = this.physics.add.staticImage(this.scale.width/2,this.scale.height-40,null)
.setDisplaySize(this.scale.width,80)
.refreshBody()
.setVisible(false);

this.physics.add.collider(this.runner,this.ground);

this.trail = this.add.particles(0,0,"runner",{
speed:0,
scale:{start:0.3,end:0},
blendMode:'ADD',
lifespan:300,
frequency:50
});

this.trail.startFollow(this.runner);
}

createGoal(){
this.goal = this.add.circle(this.scale.width*3, this.scale.height/2, 30, 0x00ffff,0.5);
this.tweens.add({
targets:this.goal,
alpha:0.2,
yoyo:true,
repeat:-1,
duration:800
});
}

createHUD(){

this.hudText = this.add.text(20,20,"",{
font:"16px monospace",
color:"#00ffff"
}).setScrollFactor(0);

this.paradoxBarBG = this.add.rectangle(20,90,200,10,0x222244)
.setOrigin(0,0).setScrollFactor(0);

this.paradoxBar = this.add.rectangle(20,90,0,10,0x00ffff)
.setOrigin(0,0).setScrollFactor(0);
}

createObstacles(){

this.obstacles = this.physics.add.group({
maxSize:20
});

this.time.addEvent({
delay:1500,
loop:true,
callback:()=>{
if(this.transitioning) return;

let obs = this.obstacles.get();
if(!obs) return;

if(!obs.texture.key){
let g = this.add.graphics();
g.fillStyle(0xff00ff);
g.fillTriangle(0,40,20,0,40,40);
g.generateTexture("spike",40,40);
g.destroy();
}

obs.setTexture("spike");
obs.setPosition(this.scale.width+50,this.scale.height-100);
obs.setActive(true);
obs.setVisible(true);
obs.body.setVelocityX(-this.speed);
obs.body.setImmovable(true);
obs.body.allowGravity=false;
}
});

this.physics.add.collider(this.runner,this.obstacles,this.gameOver,null,this);
}

jump(){
if(this.runner.body.touching.down && !this.transitioning){
this.runner.setVelocityY(-450);

this.tweens.add({
targets:this.runner,
scaleY:1.2,
duration:100,
yoyo:true
});
}
}

update(time,delta){

this.starGraphics.x -= 0.02*delta;
this.starGraphics2.x -= 0.05*delta;

if(this.transitioning) return;

let step = this.speed*(delta/1000);
this.remainingDistance -= step;

let targetRemaining = this.totalDistance/Math.pow(2,this.layer+1);

if(this.remainingDistance <= targetRemaining){
this.triggerLayer();
}

this.updateHUD();
}

triggerLayer(){

if(this.layer>=this.maxLayers){
this.gameOver();
return;
}

this.transitioning = true;
this.layer++;
this.seriesSum += 1/Math.pow(2,this.layer);

this.tweens.add({
targets:this.cameras.main,
zoom:this.cameras.main.zoom*2,
duration:800,
ease:"Cubic.easeInOut"
});

this.tweens.add({
targets:this.runner,
scale:this.runner.scale*0.5,
duration:800,
ease:"Cubic.easeInOut"
});

this.time.timeScale = 0.5;

this.cameras.main.shake(300,0.01);

this.time.delayedCall(800,()=>{
this.time.timeScale = 1;
this.transitioning = false;
});
}

updateHUD(){

let fraction = this.remainingDistance/this.totalDistance;
let progress = 1 - fraction;

this.hudText.setText(
`Layers of Infinity: ${this.layer}
Remaining Fraction: ${fraction.toFixed(6)}
Converging Sum: ${this.seriesSum.toFixed(6)}`
);

this.paradoxBar.width = 200*progress;
}

gameOver(){

this.physics.pause();
this.transitioning=true;

let overlay = this.add.rectangle(
this.scale.width/2,
this.scale.height/2,
this.scale.width,
this.scale.height,
0x000000,0.9
).setScrollFactor(0);

let text = this.add.text(
this.scale.width/2,
this.scale.height/2-60,
"PARADOX COMPLETE",
{font:"28px monospace",color:"#ff00ff"}
).setOrigin(0.5);

let seriesText = this.add.text(
this.scale.width/2,
this.scale.height/2+10,
"",
{font:"18px monospace",color:"#00ffff",align:"center"}
).setOrigin(0.5);

let restart = this.add.text(
this.scale.width/2,
this.scale.height/2+120,
"Tap to Restart",
{font:"16px monospace",color:"#ffffff"}
).setOrigin(0.5);

this.tweens.addCounter({
from:1,
to:this.layer,
duration:1500,
onUpdate:(t)=>{
let v = Math.floor(t.getValue());
let sum = 0;
for(let i=1;i<=v;i++){
sum += 1/Math.pow(2,i);
}
seriesText.setText(
`1/2 + 1/4 + 1/8 + ...
Layers: ${v}
Converges to: ${sum.toFixed(6)}`
);
}
});

this.input.once("pointerdown",()=>{
this.scene.restart();
});
}
}

const config = {
type: Phaser.AUTO,
width: window.innerWidth,
height: window.innerHeight,
physics:{
default:"arcade",
arcade:{gravity:{y:0},debug:false}
},
scale:{
mode:Phaser.Scale.RESIZE,
autoCenter:Phaser.Scale.CENTER_BOTH
},
scene:ZenosRunner
};

new Phaser.Game(config);
