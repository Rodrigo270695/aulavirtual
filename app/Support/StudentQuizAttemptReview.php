<?php

namespace App\Support;

use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizAttemptAnswer;

final class StudentQuizAttemptReview
{
    /**
     * Reconstruye el detalle por pregunta a partir del intento guardado (misma forma que el envío JSON).
     *
     * @return array<int, array<string, mixed>>
     */
    public static function buildPerQuestionBreakdown(Quiz $quiz, QuizAttempt $attempt): array
    {
        /** @var \Illuminate\Support\Collection<string, QuizAttemptAnswer> $byQuestion */
        $byQuestion = $attempt->answers->keyBy('question_id');
        $rows = [];

        foreach ($quiz->questions as $question) {
            $points = (float) $question->points;
            $ans = $byQuestion->get($question->id);

            if (in_array($question->question_type, ['single_choice', 'true_false'], true)) {
                $selectedSingle = $ans?->selected_option_id;
                $isCorrect = false;
                $pointsEarned = 0.0;
                if ($selectedSingle !== null && $selectedSingle !== '') {
                    $option = $question->options->firstWhere('id', $selectedSingle);
                    if ($option !== null && $question->options->contains('id', $option->id)) {
                        $isCorrect = (bool) $option->is_correct;
                        if ($isCorrect) {
                            $pointsEarned = $points;
                        }
                    }
                }
                $correctIds = $question->options->where('is_correct', true)->pluck('id')->values()->all();
                $rows[] = [
                    'question_id' => $question->id,
                    'correct' => $isCorrect === true,
                    'points_earned' => round($pointsEarned, 2),
                    'points_possible' => round($points, 2),
                    'correct_option_ids' => $correctIds,
                    'selected_option_ids' => $selectedSingle ? [$selectedSingle] : [],
                ];
            } elseif ($question->question_type === 'multiple_choice') {
                $raw = $ans?->text_answer ?? '';
                $selectedIds = $raw !== '' ? array_values(array_filter(explode(',', $raw), fn ($v) => is_string($v) && $v !== '')) : [];
                $correctSet = $question->options->where('is_correct', true)->pluck('id')->sort()->values()->all();
                $selectedSorted = collect($selectedIds)
                    ->filter(fn (string $id) => $question->options->contains('id', $id))
                    ->unique()
                    ->sort()
                    ->values()
                    ->all();
                $isCorrect = $correctSet === $selectedSorted;
                $pointsEarned = $isCorrect ? $points : 0.0;
                $rows[] = [
                    'question_id' => $question->id,
                    'correct' => $isCorrect,
                    'points_earned' => round($pointsEarned, 2),
                    'points_possible' => round($points, 2),
                    'correct_option_ids' => $correctSet,
                    'selected_option_ids' => $selectedSorted,
                ];
            } else {
                $rows[] = [
                    'question_id' => $question->id,
                    'correct' => null,
                    'points_earned' => round((float) ($ans?->points_earned ?? 0), 2),
                    'points_possible' => round($points, 2),
                    'correct_option_ids' => [],
                    'selected_option_ids' => [],
                    'note' => 'Este tipo de pregunta no se califica automáticamente.',
                ];
            }
        }

        return $rows;
    }

    /**
     * Oculta respuestas correctas y acierto explícito (solo puntos por ítem si aplica).
     *
     * @param  array<int, array<string, mixed>>  $perQuestion
     * @return array<int, array<string, mixed>>
     */
    public static function redactForStudentResponse(array $perQuestion): array
    {
        return array_map(static function (array $row): array {
            return [
                'question_id' => $row['question_id'],
                'correct' => null,
                'points_earned' => $row['points_earned'],
                'points_possible' => $row['points_possible'],
                'correct_option_ids' => [],
                'selected_option_ids' => $row['selected_option_ids'] ?? [],
                'note' => $row['note'] ?? null,
            ];
        }, $perQuestion);
    }
}
