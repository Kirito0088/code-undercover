export interface AvatarOption {
    path: string
    label: string
}

// Preset avatars users can pick in Profile settings. Server-side validation
// whitelists against these paths — never accept an arbitrary URL/path here,
// since `image` is rendered directly as an <img src> across the app
// (leaderboard, profile, dashboard).
export const AVATAR_OPTIONS: AvatarOption[] = [
    { path: "/characters/dennis_ritchie.png", label: "Dennis Ritchie" },
    { path: "/characters/retro_computer.png", label: "Retro Computer" },
    { path: "/characters/fox.png", label: "Fox" },
    { path: "/characters/panda.png", label: "Panda" },
    { path: "/characters/platipus.png", label: "Platypus" },
]

export function isValidAvatarPath(path: string): boolean {
    return AVATAR_OPTIONS.some((option) => option.path === path)
}
