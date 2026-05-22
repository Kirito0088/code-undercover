const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function main() {
    const updated = await prisma.mission.update({
        where: { order: 4 },
        data: {
            title: "Loop Protocol",
            type: "standard",
            goal: "Write a C program that uses a loop to allow 3 password attempts. Password: 'agent007'. Print 'Access Granted' on correct input, 'Wrong Password' on incorrect, and 'System Locked' after 3 failures.",
            startingCode: [
                '#include <stdio.h>',
                '#include <string.h>',
                '',
                'int main() {',
                '    // Agent, write your access protocol here.',
                '    // Password: "agent007"',
                '    // Max attempts: 3',
                '    ',
                '    return 0;',
                '}'
            ].join('\n'),
            mcqContent: JSON.stringify([
                {
                    id: 1,
                    question: "Which loop guarantees at least one execution?",
                    options: ["for loop", "while loop", "do-while loop", "infinite loop"],
                    correctIndex: 2
                },
                {
                    id: 2,
                    question: "What does strcmp() return when two strings are equal?",
                    options: ["1", "-1", "0", "true"],
                    correctIndex: 2
                },
                {
                    id: 3,
                    question: "Which keyword immediately exits a loop?",
                    options: ["return", "exit", "continue", "break"],
                    correctIndex: 3
                }
            ]),
            validationRules: JSON.stringify({
                requiredKeywords: ["for", "strcmp"],
                forbiddenPatterns: ["// Agent, write your access protocol here"],
                minLength: 100,
                description: "Your code must use a for/while loop with strcmp() to check the password 'agent007'. Print 'Access Granted', 'Wrong Password', or 'System Locked'."
            })
        }
    })

    console.log(`✅ Updated mission #${updated.order}: "${updated.title}"`)
    console.log(`   Goal: ${updated.goal}`)
    console.log(`   Starting code: ${updated.startingCode ? 'Set' : 'Not set'}`)
    console.log(`   MCQ: ${updated.mcqContent ? JSON.parse(updated.mcqContent).length + ' questions' : 'None'}`)
    console.log(`   Validation: ${updated.validationRules ? 'Set' : 'Not set'}`)
}

main()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(() => prisma.$disconnect())
