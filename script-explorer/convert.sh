#!/bin/sh

pdftohtml -xml -i "$1.pdf"
../script-extractor/target/debug/script-extractor --json "$1.xml" > "src/main/resources/public/res/`basename "$1"`.json"
