<?php

namespace Database\Seeders;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ChatSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $people = [
            ['name' => 'Johnson', 'email' => 'jhonson@gmail.com', 'about' => 'Product Designer'],
            ['name' => 'Bruno', 'email' => 'bruno@gmail.com', 'about' => 'Product Designer'],
            ['name' => 'Saibari', 'email' => 'saibari@gmail.com', 'about' => 'Product Designer'],
            ['name' => 'Haaland', 'email' => 'Haaland@gmail.com', 'about' => 'Product Designer'],
            ['name' => 'Henderson', 'email' => 'henderson@gmail.com', 'about' => 'Product Designer'],
        ];

        $users = collect($people)->map(fn(array $p) => User::firstOrCreate(
            ['email' => $p['email']],
            [
                'name' => $p['name'],
                'about' => $p['about'],
                'password' => 'password',
                'email_verified_at' => now(),
            ]
        ));

        [$johnson, $bruno, $saibari, $haaland] = [$users[0], $users[1], $users[2], $users[3]];

        // a direct conversation with back and forth history
        $direct = Conversation::findOrCreateDirect($johnson, $bruno);

        if ($direct->messages()->doesntExist()) {
            $script = [
                [$johnson, 'Hai Bruno'],
                [$bruno, 'Hai Jhonnnn'],
                [$johnson, 'How are you'],
                [$bruno, 'Im fine, you'],
                [$johnson, 'Im fine too'],
            ];

            foreach ($script as $i => [$sender, $body]) {
                $direct->messages()->create([
                    'user_id' => $sender->id,
                    'body' => $body,
                    'created_at' => now()->subMinutes(60 - $i * 7),
                ]);
            }

            $direct->update(['last_message_at' => $direct->messages()->max('created_at')]);

        }

        // a group conversation
        $group = Conversation::firstOrCreate(
            ['type' => 'group', 'name' => 'Project Real-time Chat app'],
            ['created_by' => $johnson->id],
        );

        if ($group->participants()->doesntExist()) {
            $group->participants()->attach([
                $johnson->id => ['role' => 'admin', 'joined_at' => now()],
                $bruno->id => ['role' => 'member', 'joined_at' => now()],
                $saibari->id => ['role' => 'member', 'joined_at' => now()],
                $haaland->id => ['role' => 'member', 'joined_at' => now()],
            ]);

            $group->addSystemMessage('Jhonson created the Group "Project Real-time Chat app"');

            $script = [
                [$johnson, 'Welcome to the project group'],
                [$bruno, 'excited to be here'],
                [$saibari, 'LESGOOOOO'],
                [$haaland, 'GASKENNN'],
                [$johnson, 'Nice Team'],
            ];

            foreach ($script as $i => [$sender, $body]) {
                $group->messages()->create([
                    'user_id' => $sender->id,
                    'body' => $body,
                    'created_at' => now()->subMinutes(30 - $i *5),
                ]);
            }

            $group->update(['last_message_at' => $group->messages()->max('created_at')]);

        }

    }
}
