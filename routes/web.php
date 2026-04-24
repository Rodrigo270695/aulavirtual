<?php

use App\Http\Controllers\Auth\SocialAuthController;
use App\Http\Controllers\CertificateVerificationController;
use App\Http\Controllers\Learning\CourseReviewController;
use App\Http\Controllers\Learning\LessonHomeworkDeliverableController;
use App\Http\Controllers\Learning\LessonProgressController;
use App\Http\Controllers\Learning\LessonQuizAttemptReviewController;
use App\Http\Controllers\Learning\LessonQuizStartController;
use App\Http\Controllers\Learning\LessonQuizSubmitController;
use App\Http\Controllers\Learning\StudentCertificateController;
use App\Http\Controllers\LearningController;
use App\Http\Controllers\Marketplace\CartController;
use App\Http\Controllers\Marketplace\CheckoutController;
use App\Http\Controllers\NotificationCenterController;
use App\Http\Controllers\PublicCatalogController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Settings\ProfileController;
use Illuminate\Support\Facades\Route;

Route::get('/', PublicCatalogController::class)->name('home');
Route::get('certificados/verificar/{code}', [CertificateVerificationController::class, 'show'])
    ->name('certificates.verify');
Route::get('certificados/qr/{code}.png', [CertificateVerificationController::class, 'qr'])
    ->name('certificates.qr');

Route::get('carrito', [CartController::class, 'index'])->name('cart.index');
Route::post('carrito/cursos/{course}', [CartController::class, 'add'])->name('cart.add');
Route::delete('carrito/cursos/{course}', [CartController::class, 'destroy'])->name('cart.remove');
Route::post('carrito/cupon/aplicar', [CartController::class, 'applyCoupon'])->name('cart.coupon.apply');
Route::delete('carrito/cupon', [CartController::class, 'removeCoupon'])->name('cart.coupon.remove');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('checkout', [CheckoutController::class, 'show'])->name('checkout.show');
    Route::post('checkout/confirmar', [CheckoutController::class, 'confirm'])->name('checkout.confirm');
    Route::post('checkout/paypal', [CheckoutController::class, 'startPayPal'])->name('checkout.paypal.start');
    Route::get('checkout/paypal/return', [CheckoutController::class, 'payPalReturn'])->name('checkout.paypal.return');
    Route::get('checkout/paypal/cancel', [CheckoutController::class, 'payPalCancel'])->name('checkout.paypal.cancel');

    Route::get('perfil', [ProfileController::class, 'account'])->name('profile.account');

    Route::get('mi-aprendizaje', [LearningController::class, 'index'])->name('learning.index');
    Route::get('mi-aprendizaje/{enrollment}/aula', [LearningController::class, 'show'])->name('learning.lessons.show');
    Route::post('mi-aprendizaje/lecciones/progreso', [LessonProgressController::class, 'upsert'])
        ->name('learning.lessons.progress.upsert');
    Route::post('mi-aprendizaje/{enrollment}/curso/reseña', [CourseReviewController::class, 'store'])
        ->name('learning.course-review.store');
    Route::get('mi-aprendizaje/{enrollment}/certificado', [StudentCertificateController::class, 'show'])
        ->name('learning.certificate.show');
    Route::post('mi-aprendizaje/{enrollment}/certificado/generar', [StudentCertificateController::class, 'generate'])
        ->name('learning.certificate.generate');
    Route::post('mi-aprendizaje/{enrollment}/lecciones/{lesson}/cuestionario/comenzar', [LessonQuizStartController::class, 'store'])
        ->name('learning.lessons.quiz.start');
    Route::post('mi-aprendizaje/{enrollment}/lecciones/{lesson}/cuestionario/evaluar', [LessonQuizSubmitController::class, 'store'])
        ->name('learning.lessons.quiz.submit');
    Route::get('mi-aprendizaje/{enrollment}/lecciones/{lesson}/cuestionario/intentos/{attempt_number}', [LessonQuizAttemptReviewController::class, 'show'])
        ->whereNumber('attempt_number')
        ->name('learning.lessons.quiz.attemptReview');
    Route::post('mi-aprendizaje/{enrollment}/lecciones/{lesson}/tarea', [LessonHomeworkDeliverableController::class, 'store'])
        ->name('learning.lessons.homework.store');
    Route::delete('mi-aprendizaje/{enrollment}/lecciones/{lesson}/tarea/{homework}', [LessonHomeworkDeliverableController::class, 'destroy'])
        ->name('learning.lessons.homework.destroy');
    Route::inertia('lista-deseos', 'wishlist/index')->name('wishlist.index');
    Route::get('notificaciones', [NotificationCenterController::class, 'index'])->name('notifications.index');
    Route::get('notificaciones/feed', [NotificationCenterController::class, 'feed'])->name('notifications.feed');
    Route::patch('notificaciones/read-all', [NotificationCenterController::class, 'markAllRead'])->name('notifications.read-all');
    Route::patch('notificaciones/{notification}/read', [NotificationCenterController::class, 'markRead'])->name('notifications.read');
    Route::patch('notificaciones/{notification}/archive', [NotificationCenterController::class, 'archive'])->name('notifications.archive');

    Route::get('dashboard', DashboardController::class)
        ->middleware(['student.marketplace', 'permission:dashboard.view'])
        ->name('dashboard');
});

// ── OAuth social login (Google, GitHub) ─────────────────────────────────
Route::prefix('auth/social')->name('social.')->middleware('guest')->group(function () {
    Route::get('{provider}',           [SocialAuthController::class, 'redirect'])->name('redirect');
    Route::get('{provider}/callback',  [SocialAuthController::class, 'callback'])->name('callback');
});

require __DIR__.'/settings.php';
require __DIR__.'/admin.php';
