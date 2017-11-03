# Honeycomb DSL (a.k.a. HoneycombJs)
Honeycomb DSL - Excel compatible, compiled DSL for TimeSheet and Payroll Calculations

## Instalation

### Amazon Aws Lambda:
Upload the contents of the root as a zip to AWS Lambda service. (read the AWS Lambda Documentation for more info)


### Node.js:

Install dependencies with
```
npm install
```

Run the microservice with
```
node server.js
```

### Web browser
use the browsified honeycomb.js file
```
<script src="honeycomb.js"></script>
```

contact the author for more info.

## The Language

### Simple Expressions

Allow simple online expressions with a return value

```
= 100 * 3%
```

### Variables

Allow named/variable expressions

```
A = { 12 }
B = { A * 10 }
C = { "Foo Bar" }
```

### Structures

Allow the use of structures

```
A.test = { 2 } 
B.result = { A.test * 2 }
```

### Arrays (1 and 2 dimentions)

Allow the use of arrays with 1 or 2 dimentions

```
A = { { 1,2,3,4 } } 
B = { {1, 2, 3, 4; 5, 6, 7, 8; 9, 10, 11, 12 } } 
```

### Recursive Calculation

Allow the use of data tables and recursive calculation
ex1. Calculate the first 50 Fibonacci numbers

```
[F[0:50]] = { IF([row[0]]<2, [row[0]], [F[-1]] + [F[-2]]) }
```

ex2. Calculate 6 digits of Pi using a running Sum

```
[P[0:100]] = { row * 2 }
[PI] = { IF(row = 0, 3, 4/(P * (P + 1) * (P + 2))) * IF(OR(row = 0, ISODD(row)), 1, -1) + [PI[-1]] }
R = {ROUND([PI[#100]],6)}
```

ex2. Calculate 6 digits of Pi using with a SUM over the PI column

```
[P[0:100]] = { row * 2 }
[PI] = { IF(row = 0, 3, 4/(P * (P + 1) * (P + 2))) * IF(OR(row = 0, ISODD(row)), 1, -1) }
R = {ROUND(SUM([PI]),6)}
```

### Array Functions

Allow the use of array functions (without the excel array function notation "{}")

ex1

```
A = { ROUND({12.22232, 12.22232}, 2) }
```

ex2. Calculate 6 digits of Pi using with "Array functions"

```
[P[0:100]] = { row * 2 }
R = { ROUND(SUM( IF([row] = 0, 3, 4/([P] * ([P] + 1) * ([P] + 2))) * IF(OR([row] = 0, ISODD([row])), 1, -1) ), 6) }
```
