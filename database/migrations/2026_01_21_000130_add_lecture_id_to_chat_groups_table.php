<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('chat_groups', function (Blueprint $table) {
            if (!Schema::hasColumn('chat_groups', 'lecture_id')) {
                $table->foreignId('lecture_id')->nullable()->after('department_name')
                    ->constrained('lectures')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('chat_groups', function (Blueprint $table) {
            if (Schema::hasColumn('chat_groups', 'lecture_id')) {
                $table->dropForeign(['lecture_id']);
                $table->dropColumn('lecture_id');
            }
        });
    }
};
