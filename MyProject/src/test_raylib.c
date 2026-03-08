#include <raylib.h>
#include <stdio.h>

void test_raylib() {
  printf("[Raylib] Initializing window...\n");
  const int screenWidth = 800;
  const int screenHeight = 450;

  InitWindow(screenWidth, screenHeight, "Hello raylib");
  SetTargetFPS(60);

  int frameCount = 0;
  while (!WindowShouldClose() && frameCount < 120) {
    BeginDrawing();
    ClearBackground(RAYWHITE);
    DrawText("Congrats! You correctly integrated raylib!", 190, 200, 20,
             LIGHTGRAY);
    DrawCircle(screenWidth / 2, 100, 50, RED);
    EndDrawing();
    frameCount++;
  }

  CloseWindow();
}
