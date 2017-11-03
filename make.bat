@echo off

echo.
echo      __ 
echo   __/ _\__
echo  / _\/_/\ \
echo  \/_/\_\/_/
echo  /\_\/_/\ \
echo  \__/\_\/_/
echo     \__/   FAVVUS honeycomb.hr
echo.


echo Starting...
echo .---------------------------------------------------------
echo | set /p="| 1 compiling parser... "
call jison rLang.jison
if %errorlevel% neq 0 exit /b %errorlevel%
echo ...sucessfully created parser
echo.
echo .---------------------------------------------------------
echo 2 running unit tests...
cd tests
call mocha *.js
if %errorlevel% neq 0 (
    cd ..
    exit /b %errorlevel% 
)
echo ...all unit tests runned sucessfully. we're go for browserify
echo.
echo .---------------------------------------------------------
echo | set /p="| 3 browserify rLang... "
cd ..
call browserify index.js -o honeycomb.js -d -s $honeycomb
if %errorlevel% neq 0 exit /b %errorlevel%
echo ...sucessfully created honeycomb.js
echo.
echo .---------------------------------------------------------
echo ^| you may now copy honeycomb.js to you project folder, be happy   
exit /b 0
