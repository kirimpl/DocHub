<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Post;
use App\Models\Interest;
use App\Models\Message;
use Illuminate\Support\Str;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        
        $users = User::all();

       
        $interests = collect();
        for ($i = 0; $i < 6; $i++) {
            $candidate = Interest::factory()->make();
            $interest = Interest::firstOrCreate(
                ['slug' => $candidate->slug],
                ['name' => $candidate->name]
            );
            $interests->push($interest);
        }

    
        if ($users->isNotEmpty()) {
       
            foreach ($users as $user) {
                $user->interests()->attach($interests->random(rand(1,3))->pluck('id')->toArray());
            }

          
            // Followers feature removed.

     
            foreach ($users as $user) {
                Post::factory(rand(1,5))->create(['user_id' => $user->id]);
            }

            
            $userCount = $users->count();
            if ($userCount >= 2) {
                for ($i = 0; $i < 30; $i++) {
                    $pair = $users->random(2);
                    Message::factory()->create([
                        'sender_id' => $pair[0]->id,
                        'recipient_id' => $pair[1]->id,
                    ]);
                }
            }
        }

      
    }
}
