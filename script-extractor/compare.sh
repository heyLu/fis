#!/bin/bash

# compare.sh <script-pdf>
#
#   Outputs an HTML page for comparing the real script
#   to the one parsed from it.

# unofficial strict mode: http://redsymbol.net/articles/unofficial-bash-strict-mode/
set -euo pipefail

script_pdf="$1"
script_base=$(dirname "$script_pdf")/$(basename --suffix=.pdf "$script_pdf")
script_name=$(basename --suffix=.pdf "$script_pdf")
script_xml="$script_base.xml"

last_page=$(pdfinfo "$script_pdf" | grep '^Pages:' | sed -E 's/^Pages:\s+//')

cat <<EOF
<!doctype html>
<html>
  <head>
    <title>$script_name - comparison</title>
    <meta charset="utf-8" />
    <style>
      .page {
        display: flex;
        margin-bottom: 3em;
      }

      .page h2 {
        width: 7em;
        margin-right: 1em;
      }

      .extracted pre {
        width: 40em;
        white-space: pre-wrap;
      }

      .original img {
        max-width: 30vw;
        /*border: 1px solid black;*/
      }
    </style>
  </head>

  <body>
    <h1>$script_name</h1>

EOF

page_num_format="%0`echo -n $last_page | wc -c`d"
for page in 1 2 3 4 5 $(($last_page / 2)) $((($last_page / 2) + 1)) $(($last_page - 3)) $(($last_page - 2)) $(($last_page - 1)) $last_page; do
    page_png=$(printf "%s-$page_num_format.png" "$script_base" $page)
    if [ ! -e "$page_png" ]; then
        printf "Generating png for page %d: %s\n" $page "$page_png" > /dev/stderr
        pdftocairo -f $page -l $page -png "$script_pdf" "$script_base"
    fi

    page_xml=$(printf "%s-%03d.xml" "$script_base" $page)
    if [ ! -e "$page_xml" ]; then
        printf "Generating xml for page %d: %s\n" $page "$page_xml" > /dev/stderr
        pdftohtml -f $page -l $page -xml "$script_pdf" "$page_xml" > /dev/null
    fi

    # continue if extracting fails
    set +e
    page_parsed=$(./target/debug/script-extractor "$page_xml" | sed 's/$/\n/')
    set -e

    cat <<EOF
    <section class="page">
      <h2>Page $page</h2>

      <div class="extracted">
        <pre>$page_parsed</pre>
      </div>

      <div class="original">
        <img src="$page_png" />
      </div>
    </section>
EOF
done

cat <<EOF
  </body>
</html>
EOF
