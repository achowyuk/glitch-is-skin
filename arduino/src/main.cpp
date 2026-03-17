#include <Arduino.h>

/**
 * GLITCH IS SKIN - Arduino Controller
 * Reads joystick X, Y and Button (SW)
 * Sends data as CSV: "x,y,sw\n"
 */

const int pinX = A0;  // VRx
const int pinY = A1;  // VRy
const int pinSW = 2;   // SW (Digital Button)

void setup() {
  Serial.begin(115200);
  pinMode(pinSW, INPUT_PULLUP);
}

void loop() {
  // Read raw values
  int x = analogRead(pinX);
  int y = analogRead(pinY);
  int sw = digitalRead(pinSW);

  // Send raw data: X (0-1023), Y (0-1023), SW (1 or 0)
  // p5.js will handle normalization and deadzone
  Serial.print(x);
  Serial.print(",");
  Serial.print(y);
  Serial.print(",");
  Serial.println(sw == LOW ? 1 : 0); // 1 = pressed, 0 = not pressed

  // Small delay for stability (~20Hz)
  delay(50);
}
