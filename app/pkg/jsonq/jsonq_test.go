package jsonq_test

import (
	"testing"

	. "github.com/getfider/fider/app/pkg/assert"
	"github.com/getfider/fider/app/pkg/jsonq"
)

func TestGet(t *testing.T) {
	RegisterT(t)

	query := jsonq.New(`{ "name": "Jon Snow", "age": 23 }`)
	Expect(query.String("name")).Equals("Jon Snow")
	Expect(query.Int32("age")).Equals(23)
}

func TestGetStringNested(t *testing.T) {
	RegisterT(t)

	query := jsonq.New(`{ "failures": { "name": "Jon Snow" } }`)
	Expect(query.String("failures.name")).Equals("Jon Snow")
}

func TestContains(t *testing.T) {
	RegisterT(t)

	query := jsonq.New(`{ "name": "Jon Snow" }`)
	Expect(query.IsArray()).IsFalse()
	Expect(query.Contains("name")).IsTrue()
	Expect(query.Contains("what")).IsFalse()
	Expect(query.Contains("feature.name")).IsFalse()
}

func TestIsArray(t *testing.T) {
	RegisterT(t)

	query := jsonq.New(`[0,1,2,3]`)
	Expect(query.IsArray()).IsTrue()
	Expect(query.ArrayLength()).Equals(4)
}

func TestContainsNested(t *testing.T) {
	RegisterT(t)

	query := jsonq.New(`{ "failures": { "name": "Name is required" } }`)
	Expect(query.IsArray()).IsFalse()

	Expect(query.Contains("failures")).IsTrue()
	Expect(query.Contains("failures.name")).IsTrue()

	Expect(query.Contains("name")).IsFalse()
	Expect(query.Contains("failures.what")).IsFalse()
}
