<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('voice_rooms', function (Blueprint $table) {
            $table->json('department_tags')->nullable();
            $table->string('notify_scope')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('voice_rooms', function (Blueprint $table) {
            $table->dropColumn(['department_tags', 'notify_scope']);
        });
    }
};
