CC = gcc
CFLAGS = -Wall -Wextra -std=c11 -Iinclude
# The order of raylib flags is important, especially on Windows
LDFLAGS = -lraylib -lSDL2main -lSDL2 -lcurl -lopengl32 -lgdi32 -lwinmm
SRC = src/main.c lib/cJSON.c src/test_raylib.c src/test_sdl.c
OBJ = $(SRC:.c=.o)
OUT = my_app.exe

all: $(OUT)

$(OUT): $(OBJ)
	$(CC) $(OBJ) -o $(OUT) $(LDFLAGS)

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

clean:
	rm -f src/*.o $(OUT)
