#!/bin/bash
# Test all Unsplash URLs
declare -A urls=(
  ["tomato"]="photo-1592841200221-a6898f307baa"
  ["basil"]="photo-1618164436241-4473940d1f5c"
  ["carrot"]="photo-1598170845058-32b9d6a5da37"
  ["lettuce"]="photo-1622206151226-18ca2c9ab4a1"
  ["pepper"]="photo-1601648764658-cf37e8c89b70"
  ["strawberry"]="photo-1464965911861-746a04b4bca6"
  ["cucumber"]="photo-1604977042946-1eecc30f269e"
  ["sunflower"]="photo-1597848212624-a19eb35e2651"
  ["mint"]="photo-1628556270448-4d4e4148e1b1"
  ["lavender"]="photo-1611909023032-2d6b3134ecba"
  ["potato"]="photo-1590165482129-1b8b27698780"
  ["spinach"]="photo-1576045057995-568f588f82fb"
  ["watermelon"]="photo-1589984662646-e7b2e4962f18"
  ["kale"]="photo-1524179091875-bf99a9a6af57"
  ["radish"]="photo-1585320806297-9794b3e4eeae"
  ["broccoli"]="photo-1459411552884-841db9b3cc2a"
  ["onion"]="photo-1618512496248-a07fe83aa8cb"
  ["corn"]="photo-1551754655-cd27e38d2076"
  ["pumpkin"]="photo-1570586437263-ab629fccc818"
  ["parsley"]="photo-1599490659213-e2b9527bd087"
  ["celery"]="photo-1580910365203-91ea9115a319"
  ["squash"]="photo-1570586437263-ab629fccc818"
  ["pansy"]="photo-1591886960571-74d43a9d4166"
  ["dahlia"]="photo-1606041008023-472dfb5e530f"
  ["lemon"]="photo-1590502593747-42a996133562"
  ["grape"]="photo-1596363505729-4190a9506133"
  ["beet"]="photo-1593105544559-ecb03bf76f82"
  ["asparagus"]="photo-1519162808019-7de1683fa2ad"
  ["melon"]="photo-1571575173700-afb9492e6a50"
)

for plant in "${!urls[@]}"; do
  id="${urls[$plant]}"
  status=$(curl -s -o /dev/null -w "%{http_code}" "https://images.unsplash.com/${id}?w=600&h=400&fit=crop")
  if [ "$status" != "200" ]; then
    echo "BROKEN ($status): $plant - $id"
  else
    echo "OK: $plant"
  fi
  sleep 0.2
done
