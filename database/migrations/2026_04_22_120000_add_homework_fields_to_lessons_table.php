<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lessons', function (Blueprint $table): void {
            $table->string('homework_title', 255)->nullable()->after('has_homework');
            $table->longText('homework_instructions')->nullable()->after('homework_title');
        });
    }

    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table): void {
            $table->dropColumn(['homework_title', 'homework_instructions']);
        });
    }
};

