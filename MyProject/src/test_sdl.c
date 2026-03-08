#include <SDL2/SDL.h>
#include <stdio.h>

void test_sdl() {
  printf("[SDL2] Initializing...\n");
  if (SDL_Init(SDL_INIT_VIDEO) < 0) {
    printf("SDL could not initialize! SDL_Error: %s\n", SDL_GetError());
    return;
  }

  SDL_Window *window =
      SDL_CreateWindow("Hello SDL2", SDL_WINDOWPOS_UNDEFINED,
                       SDL_WINDOWPOS_UNDEFINED, 640, 480, SDL_WINDOW_SHOWN);
  if (window == NULL) {
    printf("Window could not be created! SDL_Error: %s\n", SDL_GetError());
    return;
  }

  printf("[SDL2] Showing window for 2 seconds...\n");
  SDL_Delay(2000); // Show window for 2 seconds
  SDL_DestroyWindow(window);
  SDL_Quit();
}
