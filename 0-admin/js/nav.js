document.addEventListener('DOMContentLoaded', () => {

    // NAVIGATION BUTTONS
    const buttonUser = document.querySelector('.D-user');
    const buttonEvent = document.querySelector('.D-event');
    const buttonSuspension = document.querySelector('.D-suspension');
    const buttonUpload = document.querySelector('.D-upload');

    // CONTENT PANELS
    const contentUser = document.querySelector('.content-user');
    const contentEvent = document.querySelector('.content-event');
    const contentSuspension = document.querySelector('.content-suspension');
    const contentUpload = document.querySelector('.content-upload');

    // ALL CONTENT PANELS
    const allContents = [
        contentUser,
        contentEvent,
        contentSuspension,
        contentUpload
    ];

    // FUNCTION TO SWITCH CONTENT
    function showContent(selectedContent) {

        // Hide everything
        allContents.forEach(content => {
            content.classList.add('hidden');
        });

        // Show selected content
        selectedContent.classList.remove('hidden');
    }

    // BUTTON EVENTS
    buttonUser.addEventListener('click', () => {
        showContent(contentUser);
    });

    buttonEvent.addEventListener('click', () => {
        showContent(contentEvent);
    });

    buttonSuspension.addEventListener('click', () => {
        showContent(contentSuspension);
    });

    buttonUpload.addEventListener('click', () => {
        showContent(contentUpload);
    });

    // DEFAULT PAGE
    showContent(contentUser);

    });