import { z } from "zod";

// subtasks are basic
export const SubtaskSchema = z.object({
  name: z.string(),
  time: z.string(),
  done: z.boolean(),
});

// each task has metadata, and an optional list of subtasks
export const TaskSchema = z.object({
  name: z.string(),
  descr: z.string(),
  time: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  done: z.boolean(),
  subtasks: z.array(SubtaskSchema),
});


// every category has a name and a collection of tasks
export const CategorySchema = z.object({
  name: z.string(),
  items: z.array(TaskSchema),
});

// entire object, schema, contains an array of categories
export const TodoBasicSchema = z.object({
  todo: z.array(CategorySchema),
});
