@extends('layouts.app')

@section('content')
<main class="lecture-archives-page">
    <div class="lecture-archives-header">
        <h1>Lecture Archives</h1>
        <p>Recordings saved from lectures. Select a lecture to view files.</p>
    </div>

    <div class="lecture-archives-grid">
        <aside class="lecture-archives-sidebar">
            <h2>Lectures</h2>
            <div id="lectureArchivesLectures" class="lecture-archives-list"></div>
        </aside>

        <section class="lecture-archives-content">
            <h2 id="lectureArchivesTitle">Select a lecture</h2>
            <div id="lectureArchivesRecordings" class="lecture-archives-recordings"></div>
            <video id="lectureArchivesPlayer" class="lecture-archives-player" controls></video>
        </section>
    </div>
</main>
@endsection
