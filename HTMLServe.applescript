-- HTMLServe AppleScript Application
-- Handles file association and drag-and-drop for HTMLServe

property htmlserveExecutable : ""

on run
    -- Get the path to our executable
    set appPath to path to me as string
    set htmlserveExecutable to (POSIX path of appPath) & "Contents/Resources/htmlserve"

    -- Log to file
    do shell script "echo '" & (current date) & " - HTMLServe AppleScript launched without files' >> ~/Library/Logs/HTMLServe.log"

    -- Show usage dialog
    display dialog "HTMLServe - HTML File Server

To use:
• Drag HTML files onto this app icon
• Right-click HTML files → Open With → HTMLServe
• Double-click HTML files (if set as default)
• Command line: htmlserve file.html

The app is now ready to handle HTML files." buttons {"OK"} default button "OK" with icon note

    -- Log completion and quit immediately
    do shell script "echo '" & (current date) & " - HTMLServe dialog shown, exiting' >> ~/Library/Logs/HTMLServe.log"

    -- Explicitly quit to prevent background running
    tell me to quit
end run

on open droppedFiles
    -- Get the path to our executable
    set appPath to path to me as string
    set htmlserveExecutable to (POSIX path of appPath) & "Contents/Resources/htmlserve"

    -- Log the file drop
    do shell script "echo '" & (current date) & " - HTMLServe received " & (count of droppedFiles) & " files' >> ~/Library/Logs/HTMLServe.log"

    -- Process each dropped file
    repeat with aFile in droppedFiles
        set filePath to POSIX path of aFile

        -- Log the file being processed
        do shell script "echo '" & (current date) & " - Processing file: " & filePath & "' >> ~/Library/Logs/HTMLServe.log"

        -- Check if it's an HTML file
        if filePath ends with ".html" or filePath ends with ".htm" then
            try
                -- Start HTMLServe with this file in background and capture PID
                do shell script "echo '" & (current date) & " - Starting HTMLServe for: " & filePath & "' >> ~/Library/Logs/HTMLServe.log"

                -- Start the process and get its PID
                set htmlservePID to do shell script quoted form of htmlserveExecutable & " " & quoted form of filePath & " >> ~/Library/Logs/HTMLServe.log 2>&1 & echo $!"

                -- Log the PID for monitoring
                do shell script "echo '" & (current date) & " - HTMLServe started with PID: " & htmlservePID & "' >> ~/Library/Logs/HTMLServe.log"

                -- Create a monitoring script that will kill the process if it runs too long
                do shell script "( sleep 300; if ps -p " & htmlservePID & " > /dev/null 2>&1; then kill " & htmlservePID & " 2>/dev/null; echo '" & (current date) & " - Force killed HTMLServe PID " & htmlservePID & " after 5 minutes' >> ~/Library/Logs/HTMLServe.log; fi ) &"

                -- Log success
                do shell script "echo '" & (current date) & " - HTMLServe started successfully with monitoring' >> ~/Library/Logs/HTMLServe.log"

                -- Exit after handling the first HTML file
                tell me to quit
                return

            on error errorMessage
                -- Log error
                do shell script "echo '" & (current date) & " - Error starting HTMLServe: " & errorMessage & "' >> ~/Library/Logs/HTMLServe.log"
                display dialog "Error starting HTMLServe with file: " & filePath & "

Error: " & errorMessage buttons {"OK"} default button "OK" with icon stop
            end try
        else
            -- Log non-HTML file
            do shell script "echo '" & (current date) & " - Skipping non-HTML file: " & filePath & "' >> ~/Library/Logs/HTMLServe.log"
        end if
    end repeat

    -- If we get here, no HTML files were found
    do shell script "echo '" & (current date) & " - No HTML files found in dropped files' >> ~/Library/Logs/HTMLServe.log"
    display dialog "Please drop HTML files (.html or .htm) onto this app." buttons {"OK"} default button "OK" with icon stop

    -- Quit after showing the error
    tell me to quit
end open

-- Handle when the app is asked to open a document (file association)
on open location this_URL
    -- This handles URL schemes if needed
    do shell script "echo '" & (current date) & " - HTMLServe received URL: " & this_URL & "' >> ~/Library/Logs/HTMLServe.log"
end open location
