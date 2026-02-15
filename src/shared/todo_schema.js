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
  descr: z.string().nullable(),        // must exist, can be null
  time: z.string(),
  done: z.boolean(),
  subtasks: z.array(SubtaskSchema).nullable(), // must exist, can be null
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
