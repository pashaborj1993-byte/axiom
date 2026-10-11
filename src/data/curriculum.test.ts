import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { campaigns } from "./campaigns.ts";
import { getLesson, lessons, units } from "./curriculum.ts";
import { placedLessonIds, placementQuestions, trackFor } from "./placement.ts";

describe("course contract", () => {
  it("gives every unit a unique id and at least one lesson", () => {
    const ids = units.map((unit) => unit.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const unit of units) {
      assert.ok(unit.title.trim());
      assert.ok(unit.lessons.length > 0, unit.id);
    }
  });

  it("keeps lesson and exercise ids unique, with a real answer and an explanation", () => {
    const lessonIds = lessons.map((lesson) => lesson.id);
    assert.equal(new Set(lessonIds).size, lessonIds.length);
    const exerciseIds = new Set<string>();
    for (const lesson of lessons) {
      assert.ok(lesson.title.trim(), lesson.id);
      assert.ok(lesson.idea.trim(), lesson.id);
      assert.ok(lesson.exercises.length >= 3, lesson.id);
      for (const exercise of lesson.exercises) {
        assert.equal(exerciseIds.has(exercise.id), false, exercise.id);
        exerciseIds.add(exercise.id);
        assert.ok(exercise.prompt.trim(), exercise.id);
        assert.ok(exercise.explain.trim(), exercise.id);
        if (exercise.type === "choice") {
          assert.ok(exercise.options.includes(exercise.answer), exercise.id);
          assert.ok(exercise.options.length >= 2, exercise.id);
        }
        if (exercise.type === "fill") {
          assert.ok(exercise.answer.trim(), exercise.id);
        }
        if (exercise.type === "order") {
          assert.ok(exercise.items.length >= 2, exercise.id);
        }
        if (exercise.type === "match") {
          assert.ok(exercise.pairs.length >= 2, exercise.id);
        }
      }
    }
  });

  it("points every campaign at a lesson that exists", () => {
    const ids = campaigns.map((campaign) => campaign.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const campaign of campaigns) {
      assert.ok(getLesson(campaign.afterLessonId), campaign.id);
      if (campaign.requiresLesson) assert.ok(getLesson(campaign.requiresLesson), campaign.id);
      if (campaign.unitId) assert.ok(units.some((unit) => unit.id === campaign.unitId), campaign.id);
      assert.ok(campaign.passAt >= 0 && campaign.passAt <= 100, campaign.id);
    }
  });

  it("places beginners at the start and skips whole units for higher scores", () => {
    assert.equal(trackFor(0), "beginner");
    assert.equal(trackFor(5), "beginner");
    assert.equal(trackFor(6), "intermediate");
    assert.equal(trackFor(9), "intermediate");
    assert.equal(trackFor(10), "advanced");
    assert.deepEqual(placedLessonIds("beginner"), []);
    const foundations = units.find((unit) => unit.id === "foundations")!.lessons.map((lesson) => lesson.id);
    const learning = units.find((unit) => unit.id === "learning")!.lessons.map((lesson) => lesson.id);
    assert.deepEqual(placedLessonIds("intermediate"), foundations);
    assert.deepEqual(placedLessonIds("advanced"), [...foundations, ...learning]);
  });

  it("gives every placement question one answer that is one of its options", () => {
    const ids = placementQuestions.map((question) => question.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.ok(placementQuestions.length >= 8);
    for (const question of placementQuestions) {
      assert.ok(question.options.includes(question.answer), question.id);
      assert.ok(question.explain.trim(), question.id);
    }
  });
});
