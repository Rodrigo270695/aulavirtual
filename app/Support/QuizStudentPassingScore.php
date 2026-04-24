<?php

namespace App\Support;

use App\Models\Quiz;

/**
 * Nota mínima que ve y usa el alumno: nunca por debajo del 60% aunque en BD quede un valor menor (cuestionarios antiguos).
 * Si el instructor marca p. ej. 80%, se usa el máximo entre 60 y ese valor.
 */
final class QuizStudentPassingScore
{
    public const MINIMUM_FLOOR_PERCENT = 60.0;

    public static function effectiveThreshold(Quiz $quiz): float
    {
        return max(self::MINIMUM_FLOOR_PERCENT, (float) $quiz->passing_score);
    }
}
