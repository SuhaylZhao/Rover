/**
 * 使用此文件来定义自定义函数和图形块。
 * 想了解更详细的信息，请前往 https://makecode.microbit.org/blocks/custom
 */
/*
Riven
modified from pxt-servo/servodriver.ts
load dependency
"robotbit": "file:../pxt-robotbit"
*/

//% color="#31C7D5" weight=10 icon="\uf233"
namespace rover {
    const PCA9685_ADDRESS = 0x43
    const MODE1 = 0x00
    const MODE2 = 0x01
    const SUBADR1 = 0x02
    const SUBADR2 = 0x03
    const SUBADR3 = 0x04
    const PRESCALE = 0xFE
    const LED0_ON_L = 0x06
    const LED0_ON_H = 0x07
    const LED0_OFF_L = 0x08
    const LED0_OFF_H = 0x09
    const ALL_LED_ON_L = 0xFA
    const ALL_LED_ON_H = 0xFB
    const ALL_LED_OFF_L = 0xFC
    const ALL_LED_OFF_H = 0xFD

    const TRIG_PIN = DigitalPin.P12
    const ECHO_PIN = DigitalPin.P13

    enum RGBLED1 {
        R = 14,
        G = 15,
        B = 13
    }
    enum RGBLED2 {
        R = 5,
        G = 6,
        B = 4
    }
    enum RGBLED3 {
        R = 8,
        G = 9,
        B = 7
    }
    enum RGBLED4 {
        R = 11,
        G = 12,
        B = 10
    }
    export enum RGBLED {
        RGBLED1 = 1,
        RGBLED2 = 2,
        RGBLED3 = 3,
        RGBLED4 = 4
    }

    export enum Motors {
        M1 = 0x1,
        M2 = 0x2
    }

    let initialized = false
    let initializedMatrix = false
    let matBuf = pins.createBuffer(17);
    let distanceBuf = 0;

    function i2cwrite(addr: number, reg: number, value: number) {
        let buf = pins.createBuffer(2)
        buf[0] = reg
        buf[1] = value
        pins.i2cWriteBuffer(addr, buf)
    }

    function i2ccmd(addr: number, value: number) {
        let buf = pins.createBuffer(1)
        buf[0] = value
        pins.i2cWriteBuffer(addr, buf)
    }

    function i2cread(addr: number, reg: number) {
        pins.i2cWriteNumber(addr, reg, NumberFormat.UInt8BE);
        let val = pins.i2cReadNumber(addr, NumberFormat.UInt8BE);
        return val;
    }

    function initPCA9685(): void {
        i2cwrite(PCA9685_ADDRESS, MODE1, 0x00)
        setFreq(1000);
        for (let idx = 0; idx < 16; idx++) {
            setPwm(idx, 0, 0);
        }
        initialized = true
    }

    function setFreq(freq: number): void {
        // Constrain the frequency
        let prescaleval = 25000000;
        prescaleval /= 4096;
        prescaleval /= freq;
        prescaleval -= 1;
        let prescale = prescaleval; //Math.Floor(prescaleval + 0.5);
        let oldmode = i2cread(PCA9685_ADDRESS, MODE1);
        let newmode = (oldmode & 0x7F) | 0x10; // sleep
        i2cwrite(PCA9685_ADDRESS, MODE1, newmode); // go to sleep
        i2cwrite(PCA9685_ADDRESS, PRESCALE, prescale); // set the prescaler
        i2cwrite(PCA9685_ADDRESS, MODE1, oldmode);
        control.waitMicros(5000);
        i2cwrite(PCA9685_ADDRESS, MODE1, oldmode | 0xa1);
    }

    function setPwm(channel: number, on: number, off: number): void {
        if (channel < 0 || channel > 15)
            return;

        let buf = pins.createBuffer(5);
        buf[0] = LED0_ON_L + 4 * channel;
        buf[1] = on & 0xff;
        buf[2] = (on >> 8) & 0xff;
        buf[3] = off & 0xff;
        buf[4] = (off >> 8) & 0xff;
        pins.i2cWriteBuffer(PCA9685_ADDRESS, buf);
    }

    function stopMotor(index: number) {
        setPwm((index - 1) * 2, 0, 0);
        setPwm((index - 1) * 2 + 1, 0, 0);
    }
    //% blockId=rover_setRGBLED block="RGBLED | RGBLED%index Color%ccolor"
    //% weight=100
    //% ccolor.min=0 ccolor.max=0xFFFFFFFF
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    export function setRGBLED(index: RGBLED, ccolor: number): void {
        if (!initialized) {
            initPCA9685()
        }
        let blue = ccolor & 0xFF;
        let green = ccolor >> 8 & 0xFF;
        let red = ccolor >> 16 & 0xFF;
        switch (index) {
            case RGBLED.RGBLED1:
                setPwm(RGBLED1.R, 0, red * 16)
                setPwm(RGBLED1.G, 0, green * 16)
                setPwm(RGBLED1.B, 0, blue * 16)
                break;
            case RGBLED.RGBLED2:
                setPwm(RGBLED2.R, 0, red * 16)
                setPwm(RGBLED2.G, 0, green * 16)
                setPwm(RGBLED2.B, 0, blue * 16)
                break;
            case RGBLED.RGBLED3:
                setPwm(RGBLED3.R, 0, red * 16)
                setPwm(RGBLED3.G, 0, green * 16)
                setPwm(RGBLED3.B, 0, blue * 16)
                break;
            case RGBLED.RGBLED4:
                setPwm(RGBLED4.R, 0, red * 16)
                setPwm(RGBLED4.G, 0, green * 16)
                setPwm(RGBLED4.B, 0, blue * 16)
                break;
            default:
                break;
        }
    }
    //% blockId=rover_setAllRGB block="ALLRGBLED|Color%ccolor"
    //% weight=100
    //% red.min=0 red.max=0xFFFFFFFF
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    export function setALLRGB(ccolor: number): void {
        if (!initialized) {
            initPCA9685()
        }
        for (let i = 0; i < 4; i++) {
            setRGBLED(i + 1, ccolor);
        }
    }

    //% blockId=rover_MotorRun block="Motor|%index|speed %speed"
    //% weight=85
    //% speed.min=-255 speed.max=255
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    export function MotorRun(index: Motors, speed: number): void {
        if (!initialized) {
            initPCA9685()
        }
        speed = speed * 16; // map 255 to 4096
        if (speed >= 4096) {
            speed = 4095
        }
        if (speed <= -4096) {
            speed = -4095
        }
        if (index > 2 || index <= 0)
            return
        let pp = (index - 1) * 2
        let pn = (index - 1) * 2 + 1
        if (index == Motors.M2) {
            speed = -speed
        }
        if (speed >= 0) {
            setPwm(pp, 0, speed)
            setPwm(pn, 0, 0)
        } else {
            setPwm(pp, 0, 0)
            setPwm(pn, 0, -speed)
        }
    }

    /**
     * Execute two motors at the same time
     * @param motor1 First Motor; eg: M1A, M1B
     * @param speed1 [-255-255] speed of motor; eg: 150, -150
     * @param motor2 Second Motor; eg: M2A, M2B
     * @param speed2 [-255-255] speed of motor; eg: 150, -150
    */
    //% blockId=rover_motor_dual block="Motor|%motor1|speed %speed1|%motor2|speed %speed2"
    //% weight=84
    //% speed1.min=-255 speed1.max=255
    //% speed2.min=-255 speed2.max=255
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    export function MotorRunDual(motor1: Motors, speed1: number, motor2: Motors, speed2: number): void {
        MotorRun(motor1, speed1);
        MotorRun(motor2, speed2);
    }
    /**
     * 
     * @param speed forward speed
     */
    //% blockId=rover_move_forward block="speed %speed"
    //% weight=84
    //% speed.min=-255 speed.max=255
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    export function MoveForward(speed: number): void {
        MotorRunDual(Motors.M1, speed, Motors.M2, speed);
    }
    /**
     * Execute single motors with delay
     * @param index Motor Index; eg: M1A, M1B, M2A, M2B
     * @param speed [-255-255] speed of motor; eg: 150, -150
     * @param delay seconde delay to stop; eg: 1
    */
    //% blockId=rover_motor_rundelay block="Motor|%index|speed %speed|delay %delay|s"
    //% weight=81
    //% speed.min=-255 speed.max=255
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    export function MotorRunDelay(index: Motors, speed: number, delay: number): void {
        MotorRun(index, speed);
        basic.pause(delay * 1000);
        MotorRun(index, 0);
    }



    //% blockId=rover_stop block="Motor Stop|%index|"
    //% weight=80
    export function MotorStop(index: Motors): void {
        MotorRun(index, 0);
    }

    //% blockId=rover_stop_all block="Motor Stop All"
    //% weight=79
    //% blockGap=50
    export function MotorStopAll(): void {
        for (let idx = 1; idx <= 2; idx++) {
            stopMotor(idx);
        }
    }

    //% blockId=rover_ultrasonic block="Ultrasonic"
    //% weight=10
    export function Ultrasonic(): number {

        // send pulse
        pins.setPull(TRIG_PIN, PinPullMode.PullNone);
        pins.digitalWritePin(TRIG_PIN, 0)
        control.waitMicros(2);
        pins.digitalWritePin(TRIG_PIN, 1)
        control.waitMicros(10);
        pins.digitalWritePin(TRIG_PIN, 0)

        // read pulse
        let d = pins.pulseIn(ECHO_PIN, PulseValue.High, 25000);
        let ret = d;
        // filter timeout spikes
        if (ret == 0 && distanceBuf != 0) {
            ret = distanceBuf;
        }
        distanceBuf = d;
        return ret * 10 / 6 / 58;
    }
}

