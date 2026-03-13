#include "cJSON.h"
#include "uthash.h"
#include <stddef.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// SDL2
#define SDL_MAIN_HANDLED
#include <SDL2/SDL.h>
// curl
#include <curl/curl.h>

extern void test_raylib();

// --- cJSON Example ---
void test_cjson() {
  const char *json_string = "{\"name\": \"Code Undercover\", \"active\": 1}";
  cJSON *json = cJSON_Parse(json_string);
  if (!json) {
    printf("cJSON Error: [%s]\n", cJSON_GetErrorPtr());
  } else {
    cJSON *name = cJSON_GetObjectItemCaseSensitive(json, "name");
    if (cJSON_IsString(name) && (name->valuestring != NULL)) {
      printf("[cJSON] Parsed Project Name: \"%s\"\n", name->valuestring);
    }
    cJSON_Delete(json);
  }
}

// --- uthash Example ---
typedef struct {
  int id;
  char name[20];
  UT_hash_handle hh;
} User;

User *users = NULL;

void add_user(int id, const char *name) {
  User *s;
  HASH_FIND_INT(users, &id, s);
  if (s == NULL) {
    s = (User *)malloc(sizeof(User));
    s->id = id;
    HASH_ADD_INT(users, id, s);
  }
  snprintf(s->name, sizeof(s->name), "%s", name);
}

void test_uthash() {
  add_user(1, "Alice");
  add_user(2, "Bob");

  User *s;
  int id_to_find = 1;
  HASH_FIND_INT(users, &id_to_find, s);
  if (s) {
    printf("[uthash] Found user with ID 1: %s\n", s->name);
  }
}

// --- libcurl Example ---
void test_curl() {
  CURL *curl;
  CURLcode res;

  curl = curl_easy_init();
  if (curl) {
    printf("[libcurl] Fetching https://example.com...\n");
    curl_easy_setopt(curl, CURLOPT_URL, "https://example.com");
    curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 1L);
    curl_easy_setopt(curl, CURLOPT_NOBODY, 1L);

    res = curl_easy_perform(curl);
    if (res != CURLE_OK) {
      fprintf(stderr, "[libcurl] failed: %s\n", curl_easy_strerror(res));
    } else {
      printf("[libcurl] Successfully fetched example.com!\n");
    }
    curl_easy_cleanup(curl);
  }
}

// --- SDL2 Example ---
extern void test_sdl();

int main(int argc, char *argv[]) {
  (void)argc;
  (void)argv;
  SDL_SetMainReady();

  printf("=== C Library Integration Tests ===\n\n");

  test_cjson();
  printf("\n");

  test_uthash();
  printf("\n");

  test_curl();
  printf("\n");

  test_sdl();
  printf("\n");

  test_raylib();
  printf("\n");

  printf("=== All tests finished successfully ===\n");
  return 0;
}
