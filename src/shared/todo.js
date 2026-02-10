export const todo_basic = {
    todo: [
        {
            name: "Health",
            items: [
                {
                    name: "Doctor's Visit",
                    descr: "Go to SHCC",
                    time: "15 mins",
                    done: true,
                    subtasks: [
                        {
                            name: "Drive to doctor's",
                            time: "5 mins",
                            done: "True"
                        }
                    ]
                },
                {
                    name: "Workout",
                    descr: "Get swole at SW Rec",
                    time: "45 mins",
                    done: "False"
                }
            ]
        },
        {
            name: "University",
            items: [
                {
                    name: "COP3502 Project 1",
                    descr: "Do coding project",
                    time: "2 hrs",
                    done: "False"
                },
                {
                    name: "PHY2049 Exam 1",
                    descr: "Study for exam",
                    time: "2.5 hrs",
                    done: "True"
                }
            ]
        }
    ]
}