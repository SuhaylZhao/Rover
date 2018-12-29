// tests go here; this will not be compiled when this package is used as a library
let d = 0
let i = 0
let fwd_sp = 0
fwd_sp = 255
rover.setRGBLED(1, 0xFFFF00FF)
rover.setRGBLED(2, 0xFF0000FF)
rover.setRGBLED(3, 0xFF00FFFF)
rover.setRGBLED(4, 0xFFFFFF00)
basic.pause(5000)
rover.setALLRGB(0xFFFF0000)
basic.pause(1000)
rover.setALLRGB(0xFF00FF00)
basic.forever(() => {
    //carbit.MoveForward(255)
    d = Math.round(rover.Ultrasonic())
    basic.showNumber(d)
    //serial.writeNumber(d)
    //serial.writeLine(" "+d+" cm ")
    basic.pause(1000)
    rover.setALLRGB(0xFFFFFFFF)
})