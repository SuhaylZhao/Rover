// tests go here; this will not be compiled when this package is used as a library
let d = 0
let i = 0
let fwd_sp = 0
fwd_sp = 255
basic.forever(() => {
    if (carbit.Ultrasonic() < 10) {
        carbit.MotorRunDual(-100, 100);
        basic.showArrow(Direction.Left)
    } else {
        carbit.MoveForward(255);
        basic.showArrow(Direction.Right)
    }
})