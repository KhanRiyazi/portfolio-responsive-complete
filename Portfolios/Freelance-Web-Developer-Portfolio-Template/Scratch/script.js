document.addEventListener("DOMContentLoaded", function() {
    const procedure = document.getElementById('procedure');
    const steps = [
        {
            title: 'Introduction (10 minutes)',
            content: `
                <p><strong>Begin with a discussion:</strong> Ask students if they have ever played a video game or used an app. Explain that these are all made using coding.</p>
                <p><strong>Introduce Scratch:</strong> Explain that Scratch is a way to learn coding by creating stories, games, and animations.</p>
                <p><strong>Show an Example:</strong> Briefly demonstrate a simple Scratch project (e.g., making a character move).</p>
            `
        },
        {
            title: 'Exploring the Scratch Interface (15 minutes)',
            content: `
                <p><strong>Explain the Interface:</strong></p>
                <ul>
                    <li>Stage Area: Where the action happens.</li>
                    <li>Sprite List: Characters and objects in your project.</li>
                    <li>Block Palette: Contains different coding blocks.</li>
                    <li>Coding Area: Where you drag and drop blocks to create code.</li>
                </ul>
                <p><strong>Walk Through Basic Functions:</strong></p>
                <ul>
                    <li>How to add a sprite.</li>
                    <li>How to change the background.</li>
                    <li>How to start a script.</li>
                </ul>
            `
        },
        {
            title: 'Creating a Basic Project (15 minutes)',
            content: `
                <p><strong>Project Goal:</strong> Create a simple animation where a sprite moves across the screen.</p>
                <p><strong>Step-by-Step Instructions:</strong></p>
                <ul>
                    <li>Choose a Sprite: Students select a sprite from the library.</li>
                    <li>Move the Sprite: Use motion blocks to make the sprite move 10 steps.</li>
                    <li>Add an Event: Use the "when green flag clicked" block to start the action.</li>
                    <li>Looping: Introduce the concept of loops by adding a "forever" block to make the sprite move continuously.</li>
                    <li>Adding a Sound: Show how to add sound when the sprite moves.</li>
                </ul>
            `
        },
        {
            title: 'Experimentation and Creativity (10 minutes)',
            content: `
                <p>Allow students to experiment by adding more blocks, changing sprites, or adding backgrounds.</p>
                <p>Encourage them to explore and be creative with their projects.</p>
            `
        },
        {
            title: 'Sharing and Reflection (5 minutes)',
            content: `
                <p><strong>Share Projects:</strong> If time permits, allow a few students to share their projects with the class.</p>
                <p><strong>Reflect:</strong> Ask students what they found easy or difficult and what they enjoyed about using Scratch.</p>
            `
        }
    ];

    steps.forEach(step => {
        const stepDiv = document.createElement('div');
        stepDiv.innerHTML = `<h3>${step.title}</h3>${step.content}`;
        procedure.appendChild(stepDiv);
    });
});
