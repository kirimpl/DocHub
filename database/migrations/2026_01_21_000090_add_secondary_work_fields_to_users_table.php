<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'secondary_work_place')) {
                $table->string('secondary_work_place')->nullable()->after('work_place');
            }
            if (!Schema::hasColumn('users', 'secondary_speciality')) {
                $table->string('secondary_speciality')->nullable()->after('speciality');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'secondary_speciality')) {
                $table->dropColumn('secondary_speciality');
            }
            if (Schema::hasColumn('users', 'secondary_work_place')) {
                $table->dropColumn('secondary_work_place');
            }
        });
    }
};
