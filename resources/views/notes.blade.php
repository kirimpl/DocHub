@extends('layouts.app')

@section('content')
<div class="notes-page">
    <div class="notes-header">
        <div class="notes-title">
            <h2>Заметки</h2>
            <p>Личные заметки сохраняются только для вашего профиля</p>
        </div>
        <div class="notes-toolbar">
            <input type="text" id="notesSearch" placeholder="Поиск заметок">
        </div>
    </div>

    <div class="note-create" id="noteCreateCard">
        <input type="text" id="noteTitle" placeholder="Заголовок">
        <textarea id="noteBody" placeholder="Введите заметку..."></textarea>
        <div class="note-actions">
            <div class="note-colors">
                <button type="button" class="color-dot" data-color="#FFFFFF" style="background:#FFFFFF;"></button>
                <button type="button" class="color-dot" data-color="#FFF8C5" style="background:#FFF8C5;"></button>
                <button type="button" class="color-dot" data-color="#DFF7E9" style="background:#DFF7E9;"></button>
                <button type="button" class="color-dot" data-color="#E6F0FF" style="background:#E6F0FF;"></button>
                <button type="button" class="color-dot" data-color="#FBE4E4" style="background:#FBE4E4;"></button>
            </div>
            <div class="note-create-actions">
                <button type="button" id="pinNoteBtn" class="note-btn">Закрепить</button>
                <button type="button" id="createNoteBtn" class="note-btn primary">Сохранить</button>
            </div>
        </div>
    </div>

    <div class="notes-grid" id="notesGrid"></div>
</div>
@endsection
