class ZenosRunner extends Phaser.Scene {
  constructor() {
    super("ZenosRunner");

    this.totalDistance = 1000;
    this.remainingDistance = 1000;
    this.layer = 0;
    this.seriesSum = 0;
    this.speed = 200;
    this.isGameOver = false;
  }

  preload() {}

  create() {
    this.createBackground();
    this.createGround();
    this.createPlayer();
    this.createHUD();
    this.createObstacles();

    this.cameras.main.setBackgroundColor("#000011");

    // Controls
    this.input.on("pointerdown", this.jump, this);
    this.input.keyboard.on("keydown-SPACE", this.jump, this);
  }

  createBackground() {
    this.starsFar = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, null)
      .setOrigin(0)
      .setScrollFactor(0);

    this.starsMid = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, null)
      .setOrigin(0)
      .setScrollFactor(0);

    this.graphics = this.add.graphics();
    this.graphics.fillStyle(0x00ffff, 0.5);
    for (let i = 0; i < 200; i++) {
      this.graphics.fillCircle(
        Phaser.Math.Between(0, this.scale.width),
        Phaser.Math.Between(0, this.scale.height),
        Phaser.Math.Between(1, 3)
      );
    }
  }

  createGround() {
    this.ground = this.physics.add.staticGroup();
    this.ground.create(this.scale.width / 2, this.scale.height - 20, null)
      .setDisplaySize(this.scale.width, 40)
      .refreshBody()
      .setVisible(false);
  }

  createPlayer() {
    this.player = this.add.rectangle(100, this.scale.height - 100, 40, 60, 0x00ffff);
    this.physics.add.existing(this.player);

    this.player.body.setGravityY(800);
    this.player.body.setCollideWorldBounds(true);

    this.physics.add.collider(this.player, this.ground);
  }

  createObstacles() {
    this.obstacles = this.physics.add.group();

    this.time.addEvent({
      delay: 2000,
      loop: true,
      callback: () => {
        if (this.isGameOver) return;

        let obstacle = this.add.rectangle(
          this.scale.width + 50,
          this.scale.height - 80,
          40,
          40,
          0xff00ff
        );

        this.physics.add.existing(obstacle);
        obstacle.body.setVelocityX(-this.speed);
        obstacle.body.setImmovable(true);
        obstacle.body.allowGravity = false;

        this.obstacles.add(obstacle);
      }
    });

    this.physics.add.collider(this.player, this.obstacles, this.gameOver, null, this);
  }

  createHUD() {
    this.hud = this.add.text(20, 20, "", {
      font: "16px monospace",
      fill: "#00ffff"
    }).setScrollFactor(0);
  }

  jump() {
    if (this.player.body.touching.down && !this.isGameOver) {
      this.player.body.setVelocityY(-400);
    }
  }

  update(time, delta) {
    if (this.isGameOver) return;

    this.moveBackground(delta);
    this.updateDistance(delta);
    this.updateHUD();
  }

  moveBackground(delta) {
    this.graphics.x -= 0.02 * delta;
  }

  updateDistance(delta) {
    let step = this.speed * (delta / 1000);
    this.remainingDistance -= step;

    // When reaching halfway of remaining distance
    if (this.remainingDistance <= this.totalDistance / Math.pow(2, this.layer + 1)) {
      this.layer++;
      this.seriesSum += 1 / Math.pow(2, this.layer);

      this.cameras.main.zoom *= 2;
      this.player.scale *= 0.5;

      // NEVER reach zero mathematically
      if (this.layer > 20) {
        this.gameOver();
      }
    }
  }

  updateHUD() {
    let fraction = (this.remainingDistance / this.totalDistance).toFixed(6);

    this.hud.setText(
      `Layers of Infinity: ${this.layer}
Remaining Fraction: ${fraction}
Converging Sum: ${this.seriesSum.toFixed(6)}
Paradox Meter: ${(1 - fraction).toFixed(6)}`
    );
  }

  gameOver() {
    this.isGameOver = true;
    this.physics.pause();

    this.add.rectangle(
      this.scale.width / 2,
      this.scale.height / 2,
      this.scale.width,
      this.scale.height,
      0x000000,
      0.8
    ).setScrollFactor(0);

    this.add.text(
      this.scale.width / 2,
      this.scale.height / 2 - 50,
      "PARADOX ACHIEVED",
      { font: "32px monospace", fill: "#ff00ff" }
    ).setOrigin(0.5);

    this.add.text(
      this.scale.width / 2,
      this.scale.height / 2 + 20,
      `You completed ${this.layer} infinite layers.

Zeno’s Dichotomy Paradox:
To reach the goal, you must first reach half.
Then half of the remaining half.
Then half again...
Infinitely.

Mathematically, the sum converges to 1.
But visually — you never arrive.`,
      { font: "16px monospace", fill: "#00ffff", align: "center" }
    ).setOrigin(0.5);
  }
}

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: ZenosRunner
};

new Phaser.Game(config);
