export function Paddle(options) {

  this.position = [0, 0];
  
  this.width = 20;
  this.height = 100;

  this.speed = 0;

  const unitsPerSecond = 250;

  this.setSpeed = (speed) => {
    this.speed = speed
  }

  this.getSpeed = () => {
    return this.speed
  }

  this.getPosition = () => {
    return this.position
  }

  this.setPosition = (array) => {
    this.position = array;
  }

  // addEventListener('keydown', (event) => {
  //   if (event.key === options.down) {
  //     this.speed = unitsPerSecond;
  //   } else if (event.key === options.up) {
  //     this.speed = -unitsPerSecond;
  //   }
  // });

  // addEventListener('keyup', (event) => {
  //   if (event.key === options.down) {
  //     this.speed = 0;
  //   } else if (event.key === options.up) {
  //     this.speed = 0;
  //   }
  // })
  
  this.update = (delta) => {
    // console.log('this.pos', this.position)
    this.position[1] = this.position[1] + this.speed * delta;
    if (this.position[1] < 0) { this.position[1] = 0; }
    if (this.position[1] + this.height > options.height) { this.position[1] = options.height - this.height; }

  }

  this.draw = () => {
    options.ctx.fillRect(this.position[0], this.position[1], this.width, this.height);
  }

}