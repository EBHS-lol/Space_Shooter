'use strict'



const config = {
    type: Phaser.AUTO,
    width: 1000,
    height: 600,
    antialias: false,
    
    parent: 'game-canvas',
    state: {
        preload: preload,
        create: create,
        update: update
    }
}

const game = new Phaser.Game(config)
const fireRate = 300 //miliseconds
const enemyTurnSpeed = 0.015
const enemyFireRate = 1000
let enemyLastShot = 0;
let lastShot = 0;
let space;
let a;
let d;
let l;
let player;
let propultion = 0;
let cos = 0;
let sin = 0;
let playerParticlesGroup;
let playerProjectilesGroup;
let enemyProjectilesGroup;
let playerHealth = 10;
let projectileCos = 0;
let projectileSin = 0;
let enemiesGroup;
let toDestroy = []
let score = 0;
let rndAngle = 0;
let tutorialText;

function preload() {
    game.load.image("spaceShip", "Sprites/spaceship.png");
    game.load.image("enemy", "Sprites/enemy.png");
    game.load.image("projectile_small", "Sprites/projectile_small.png");
    game.load.image("projectile_big", "Sprites/projectile_big.png");

}

function create() {
    
  game.physics.startSystem(Phaser.Physics.ARCADE);

    player = game.add.sprite(game.width/2, game.height/2, "spaceShip");
    game.physics.arcade.enable(player)
    player.scale.set(7, 7)
    player.anchor.set(0.5, 0.5)
    player.body.collideWorldBounds = true;
    player.health = 100;
    // Particles
    playerParticlesGroup = game.add.group();
    //Projectiles
    playerProjectilesGroup = game.add.group();
    // Controls
    space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR)
    a = game.input.keyboard.addKey(Phaser.Keyboard.A)
    d = game.input.keyboard.addKey(Phaser.Keyboard.D)
    l = game.input.keyboard.addKey(Phaser.Keyboard.L)
    // Enemies
    enemiesGroup = game.add.group();
    //enemyProjectilesGroup
    enemyProjectilesGroup = game.add.group();
    //enemiesGroup.create(-1000, -1000, "enemy");
    
    // Tutorial
    tutorialText = game.add.text(game.width/2, game.height - 20, "A , D - Steer    SPACE - Forward    L - shoot", {
            font: "20px Press_Start",
            fill: '#00FF73'
        })
    tutorialText.anchor.set(0.5, 0.5)

    game.time.events.add(4000, function () {
        game.add.tween(tutorialText).to({ alpha: 0 }, 2000, Phaser.Easing.Linear.None, true);
    }, 
    this)
}

function update() {
    //Add friction
        enemies();

    // Propultion
    if (space.isDown) {
        if (propultion < 700) {
            propultion += 10;
        }
    } else if (space.isUp && propultion > 0) {
        propultion -= 10
    }
    // Turn right
    if (d.isDown) {
        player.angle += 2.5
    }
    if (a.isDown) {
        player.angle -= 2.5
    }

    movePlayer(propultion, player.rotation);
    shoot();
    //Collisions & overlap 
    game.physics.arcade.overlap(playerProjectilesGroup, enemiesGroup, enemyShotCallback)
    game.physics.arcade.collide(player, enemiesGroup)
    game.physics.arcade.collide(enemiesGroup)
    game.physics.arcade.overlap(player, enemyProjectilesGroup, playerHitCallback)

    while(toDestroy.length > 0) {
        toDestroy.pop().destroy()
    }

    // Enemies logic
    enemiesGroup.forEachAlive(enemiesLogic)
}

function playerHitCallback(layer, projectile) {
    layer.health = layer.health - 1
    document.getElementById("health").textContent = "Health: "+layer.health+"%"
    if (layer.health == 0) {
        layer.kill()
        game.add.text(game.width/2, game.height/2, "Game over!!!", {
            font: "60px Press_Start",
            fill: '#00FF73'
        }).anchor.set(0.5, 0.5)
        rndAngle = game.rnd.between(-1 * Math.PI, Math.PI)
    }
    projectile.kill()
    toDestroy.push(projectile)
}

function enemyShotCallback(projectile, enemy){
    //console.log(1)
    enemy.health -= 1;
    if (enemy.health == 0) {
    enemy.destroy()
    score += 100
    document.getElementById("score").textContent = "Score: "+score
    }
    projectile.kill()
    toDestroy.push(projectile)
}

function enemiesLogic(enemy) {
    // Rotate towards the player
    let targetAngle = Phaser.Math.angleBetween(enemy.x, enemy.y, player.x, player.y) + Math.PI / 2
    if (player.health <= 0) {
        targetAngle = rndAngle
    }
    targetAngle = Phaser.Math.wrapAngle(targetAngle, true) 
    targetAngle = Phaser.Math.wrapAngle(targetAngle, true) 

    let diff = Phaser.Math.wrapAngle(enemy.rotation - targetAngle, true) 
    //console.log("Target:" + targetAngle+ "\ncurr: "+enemy.rotation+ "\ndiff: "+ diff)
    let projectileCos = Math.cos(enemy.rotation + Math.PI*3/2)
    let projectileSin = Math.sin(enemy.rotation + Math.PI*3/2)   
    if (Math.abs(diff) > 0.03 && Math.sign(diff) == -1) {
        enemy.rotation+=enemyTurnSpeed
    } else if (Math.abs(diff) > 0.03 && Math.sign(diff) == 1) {
        enemy.rotation-=enemyTurnSpeed
    } else if ((game.time.now - enemy.lastShot) > enemyFireRate && player.health > 0) {
        enemy.lastShot = game.time.now
        
        let projectileEnemy = enemyProjectilesGroup.create(enemy.x, enemy.y, "projectile_small")
        projectileEnemy.scale.set(2, 2)
        projectileEnemy.anchor.set(0.5, 0.5)
        projectileEnemy.rotation = enemy.rotation
        projectileEnemy.x += 18 * projectileCos;
        projectileEnemy.y += 18 * projectileSin;
        game.physics.arcade.enable(projectileEnemy)
        projectileEnemy.body.velocity.x = 500 * projectileCos;
        projectileEnemy.body.velocity.y = 500 * projectileSin;
    }
    // Movement

    let cos = Math.cos(enemy.rotation + Math.PI*3/2)
    let sin = Math.sin(enemy.rotation + Math.PI*3/2) 
    const turnSpeed = 0.005;
    const vel = enemy.body.velocity;
    vel.x += (300 * cos - vel.x) * turnSpeed;
    vel.y += (300 * sin - vel.y) * turnSpeed;
    // Shooting
      

    
        
}

function enemies() {
    if (enemiesGroup.length < 4) {
        summonEnemy()
    }
}

function summonEnemy() {
    let x = getRandomSpawnX()
    let y = getRandomSpawnY()
    let enemy = enemiesGroup.create(x, y, "enemy"); //TODO Make enemies spawn outside of the map
    enemy.scale.set(5, 5)
    enemy.anchor.set(0.5, 0.5)
    enemy.health = 3;
    enemy.lastShot = 0;
    game.physics.arcade.enable(enemy)   
    enemy.body.velocity.x = 2
    enemy.body.velocity.y = 0
}

function getRandomSpawnX() {
    let random = game.rnd.between(1,2)
    if (random == 1) {
        return 0 - game.rnd.between(0, 200)
    } else {
        return game.width + game.rnd.between(0, 200)
    }
}

function getRandomSpawnY() {
    let random = game.rnd.between(1,2)
    if (random == 1) {
        return 0 - game.rnd.between(0, 200)
    } else {
        return game.height + game.rnd.between(0, 200)
    }
}

function movePlayer(propultion, rotation) {
    
    // Update cos and sin only if space is held down
    if (space.isDown) {
        cos = Math.cos(rotation + Math.PI*3/2)
        sin = Math.sin(rotation + Math.PI*3/2) 
        playerParticles(cos, sin, rotation);
    }

    
    const turnSpeed = 0.005;
    const vel = player.body.velocity;
    vel.x += (propultion * cos - vel.x) * turnSpeed;
    vel.y += (propultion * sin - vel.y) * turnSpeed;
}

function shoot() {
    projectileCos = Math.cos(player.rotation + Math.PI*3/2)
    projectileSin = Math.sin(player.rotation + Math.PI*3/2)     

    if (!(l.isDown && (game.time.now - lastShot) > fireRate)) {
        return;
    }
        lastShot = game.time.now
        
        let projectileFriendly = playerProjectilesGroup.create(player.x, player.y, "projectile_small")
        projectileFriendly.scale.set(4, 4)
        projectileFriendly.anchor.set(0.5, 0.5)
        projectileFriendly.rotation = player.rotation
        projectileFriendly.x += 18 * projectileCos;
        projectileFriendly.y += 18 * projectileSin;
        game.physics.arcade.enable(projectileFriendly)
        projectileFriendly.body.velocity.x = 500 * projectileCos;
        projectileFriendly.body.velocity.y = 500 * projectileSin;
}

function playerParticles(cos, sin, rotation) {
    let particle = playerParticlesGroup.create(player.x, player.y, "projectile_small")
    particle.scale.set(4,4)
    particle.anchor.set(0.5, 0.5) 
    particle.rotation = rotation
    game.physics.arcade.enable(particle);
    particle.x -= 16 * cos;
    particle.y -= 16 * sin; 
    particle.body.velocity.x = -400 * (cos + game.rnd.realInRange(-0.3, 0.3));
    particle.body.velocity.y = -400 * (sin + game.rnd.realInRange(-0.3, 0.3));
        const tween = game.add.tween(particle).to({ alpha: 0 }, 250, Phaser.Easing.Linear.None, true);
        tween.onComplete.add(function() {
            particle.destroy();
        });
}
