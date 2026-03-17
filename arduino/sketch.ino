/**
 * GLITCH IS SKIN - Arduino Controller
 * Hardware: Arduino Uno R3 + Joystick Module
 * 
 * Connections:
 * VRx -> A0
 * VRy -> A1
 * SW  -> D2
 * GND -> GND
 * 5V  -> 5V
 */

const int pinX = A0;  // VRx
const int pinY = A1;  // VRy
const int pinSW = 2;   // SW (Digital Button)

void setup() {
  // Higher baud rate for responsive serial communication
  Serial.begin(115200);
  
  // Use internal pullup for the button
  pinMode(pinSW, INPUT_PULLUP);
}

void loop() {
  // Read raw joystick values (0 - 1023)
  int x = analogRead(pinX);
  int y = analogRead(pinY);
  
  // Read button (LOW when pressed due to INPUT_PULLUP)
  int sw = digitalRead(pinSW);

  // Send raw data: X, Y, and Button status (1 = pressed, 0 = idle)
  Serial.print(x);
  Serial.print(",");
  Serial.print(y);
  Serial.print(",");
  Serial.println(sw == LOW ? 1 : 0);

  // 50ms delay for stable 20Hz polling
  delay(50);
}
