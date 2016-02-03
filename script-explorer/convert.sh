#!/bin/sh

script=$1
name="${script%.*}"
pdftohtml -xml -i "$name.pdf"
../script-extractor/target/debug/script-extractor --json "$name.xml" > "src/main/resources/public/res/`basename "$name"`.json"
